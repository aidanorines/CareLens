// CareLens AI patient summary generator.
//
// Calls the Hugging Face Router chat-completions API with a strict clinical
// decision support prompt. On ANY failure (missing token, non-2xx response,
// timeout, network error, parse error) returns a fixed system-note string
// so the demo never breaks.
//
// Accepts the frontend Patient JSON shape from
// frontend/src/types/patient.ts and returns a single string ready to be
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
  "You are a professional clinical decision support (CDS) assistant. You are",
  "NOT a licensed clinician and you do NOT provide medical diagnoses or",
  "treatment decisions. Your role is to summarize the structured patient data",
  "provided in the user message.",
  "",
  "STRICT RULES:",
  "1. ONLY use information from the patient data in the user message. Do NOT",
  "   use outside knowledge, do NOT invent labs, medications, diagnoses,",
  "   vitals, allergies, or history.",
  "2. If the data is missing, ambiguous, contradictory, or insufficient to",
  `   summarize confidently, you MUST respond with EXACTLY: "${INSUFFICIENT_INFO}"`,
  "3. You may suggest open clinical questions to investigate, but you must",
  "   NEVER answer them, and you must NEVER recommend specific treatments,",
  "   medications, or diagnostic tests.",
  "4. Do not label anything as a confirmed diagnosis unless it appears as a",
  "   condition/problem in the provided data.",
  "",
  "FORMAT (MUST follow EXACTLY):",
  "**Summary**",
  "[1-2 sentences summarizing the patient's state]",
  "",
  "**Key Findings**",
  "- [Bullet points of relevant conditions, vitals, and meds]",
  "",
  "**Open Questions**",
  "- [Bullet points of clinical questions to investigate]",
].join("\n");

function isTokenConfigured(token) {
  return (
    typeof token === "string" &&
    token.trim().length > 0 &&
    token !== "hf_xxx_your_token_here" &&
    token !== "YOUR_TOKEN_HERE"
  );
}

function buildUserMessage(patientData) {
  const json = JSON.stringify(patientData, null, 2);
  return [
    "Summarize the following patient record for a clinician. Use ONLY the",
    `data below. If insufficient, respond EXACTLY with "${INSUFFICIENT_INFO}".`,
    "",
    "PATIENT_DATA (JSON):",
    json,
  ].join("\n");
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

async function generateSummary(patientData) {
  if (!hasSufficientPatientData(patientData)) {
    return INSUFFICIENT_INFO;
  }

  const token = process.env.HF_TOKEN;
  if (!isTokenConfigured(token)) {
    return FALLBACK_MESSAGE;
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
          { role: "user", content: buildUserMessage(patientData) },
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 600,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return FALLBACK_MESSAGE;
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return FALLBACK_MESSAGE;
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
    return FALLBACK_MESSAGE;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  generateSummary,
  INSUFFICIENT_INFO,
  FALLBACK_MESSAGE,
};
