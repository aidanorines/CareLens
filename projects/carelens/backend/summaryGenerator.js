// CareLens AI patient summary generator.
//
// Calls the Hugging Face Router chat-completions API with a strict clinical
// decision support prompt. On ANY failure (missing token, non-2xx response,
// timeout, network error, parse error) returns a deterministic fallback
// summary so the demo never breaks.
//
// Accepts the frontend Patient JSON shape from
// frontend/src/types/patient.ts plus an optional assessmentInput
// ({ riskLevel, riskScore, flags }) and returns a single string ready to be
// dropped into the Assessment.summary field.

try {
  require("dotenv").config();
} catch {
  // dotenv is optional; tests can run with env vars only.
}

const HF_CHAT_COMPLETIONS_URL = "https://router.huggingface.co/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const REQUEST_TIMEOUT_MS = 15000;

const INSUFFICIENT_INFO = "I don't have enough information.";

const FALLBACK_MESSAGE =
  "System Note: AI summarization currently unavailable. Please review patient vitals manually.";

const SYSTEM_PROMPT = [
  "You are a clinical decision support (CDS) assistant for SYNTHETIC patient",
  "data. You are NOT a clinician. Do NOT diagnose, prescribe, or recommend",
  "medication changes or tests.",
  "",
  "RULES:",
  "1. Use ONLY the patient data and risk context in the user message. Never",
  "   invent labs, meds, diagnoses, vitals, or history.",
  `2. If the data is too sparse to summarize, respond EXACTLY with: "${INSUFFICIENT_INFO}"`,
  "3. Be concise. No filler. No restating obvious facts.",
  "",
  "OUTPUT FORMAT (plain text, no markdown, no asterisks). Use EXACTLY these",
  "section headers, each on its own line, with a blank line between sections.",
  "Each bullet starts with '- ' on its own line.",
  "",
  "Summary:",
  "<ONE sentence, max 25 words, naming the dominant risk drivers>",
  "",
  "Key Findings:",
  "- <max 6 words per bullet>",
  "- <max 6 words per bullet>",
  "- <max 6 words per bullet>",
  "(3 to 5 bullets total. Group meds by class instead of listing every drug.)",
  "",
  "Open Questions:",
  "- <max 10 words per bullet>",
  "- <max 10 words per bullet>",
  "(2 bullets max. Skip if nothing meaningful to ask.)",
].join("\n");

function getApiToken() {
  return process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || "";
}

function isTokenConfigured(token) {
  return (
    typeof token === "string" &&
    token.trim().length > 0 &&
    token !== "hf_xxx_your_token_here" &&
    token !== "YOUR_TOKEN_HERE"
  );
}

function normalizeFlags(flags) {
  if (!Array.isArray(flags)) return [];
  return flags
    .map((flag) =>
      typeof flag === "string" ? flag : flag?.reason || flag?.type || "",
    )
    .filter(Boolean);
}

function buildFallback(assessmentInput) {
  if (!assessmentInput) return FALLBACK_MESSAGE;

  const riskLevel = assessmentInput.riskLevel || "Unknown";
  const flagList = normalizeFlags(assessmentInput.flags);
  const flagsText = flagList.length > 0 ? flagList.join(", ") : "no major flags identified";

  return (
    `Based on the synthetic record, this patient has a ${riskLevel} risk profile ` +
    `with key flags including ${flagsText}. Review vitals, conditions, and ` +
    `recent encounters for follow-up context.`
  );
}

function buildUserMessage(patientData, assessmentInput) {
  const lines = [
    "Summarize the following SYNTHETIC patient record for a clinician. Use",
    `ONLY the data below. If insufficient, respond EXACTLY with "${INSUFFICIENT_INFO}".`,
    "",
    "PATIENT_DATA (JSON):",
    JSON.stringify(patientData, null, 2),
  ];

  if (assessmentInput) {
    lines.push(
      "",
      "RISK_CONTEXT (computed by rule-based engine, treat as additional evidence):",
      JSON.stringify(
        {
          riskLevel: assessmentInput.riskLevel,
          riskScore: assessmentInput.riskScore,
          flags: normalizeFlags(assessmentInput.flags),
        },
        null,
        2,
      ),
    );
  }

  return lines.join("\n");
}

function hasSufficientPatientData(patientData) {
  if (!patientData || typeof patientData !== "object") return false;

  const vitals = patientData.vitals;
  const hasVitals =
    vitals &&
    typeof vitals === "object" &&
    (typeof vitals.bloodPressure === "string" ||
      typeof vitals.heartRate === "number" ||
      typeof vitals.bmi === "number" ||
      typeof vitals.temperature === "number" ||
      typeof vitals.oxygenSaturation === "number");

  const hasConditions =
    Array.isArray(patientData.conditions) && patientData.conditions.length > 0;
  const hasMeds =
    Array.isArray(patientData.medications) && patientData.medications.length > 0;
  const hasEncounters =
    Array.isArray(patientData.encounters) && patientData.encounters.length > 0;

  return hasVitals || hasConditions || hasMeds || hasEncounters;
}

async function generateSummary(patientData, assessmentInput) {
  if (!hasSufficientPatientData(patientData)) {
    return INSUFFICIENT_INFO;
  }

  const token = getApiToken();
  if (!isTokenConfigured(token)) {
    return buildFallback(assessmentInput);
  }

  const model = process.env.HF_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(HF_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(patientData, assessmentInput) },
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 280,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return buildFallback(assessmentInput);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return buildFallback(assessmentInput);
    }

    const trimmed = content.trim();
    if (trimmed === INSUFFICIENT_INFO) {
      return INSUFFICIENT_INFO;
    }
    return trimmed;
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(`[summaryGenerator] AI summary unavailable: ${err.message}`);
    }
    return buildFallback(assessmentInput);
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  generateSummary,
  buildFallback,
  INSUFFICIENT_INFO,
  FALLBACK_MESSAGE,
};
