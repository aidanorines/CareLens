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

require("dotenv").config();

const HF_CHAT_COMPLETIONS_URL = "https://router.huggingface.co/v1/chat/completions";
const DEFAULT_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const REQUEST_TIMEOUT_MS = 15000;

const CLINICAL_DISCLAIMER =
  "Clinical Disclaimer: This AI-generated summary is for clinical decision " +
  "support only. It is not a medical diagnosis and must be reviewed by a " +
  "licensed healthcare professional before any clinical action is taken.";

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
  "3. Keep the summary concise and clinically relevant. Prefer short sections",
  "   such as Demographics, Active Problems, Medications, Vitals, and Risk",
  "   Factors. Only include sections supported by the provided data.",
  "4. ALWAYS end your response with this exact disclaimer on its own line:",
  `   "${CLINICAL_DISCLAIMER}"`,
].join("\n");

function isTokenConfigured(token) {
  return (
    typeof token === "string" &&
    token.trim().length > 0 &&
    token !== "hf_xxx_your_token_here" &&
    token !== "YOUR_TOKEN_HERE"
  );
}

function withDisclaimer(text) {
  if (!text) return CLINICAL_DISCLAIMER;
  const trimmed = text.trim();
  if (trimmed.includes(CLINICAL_DISCLAIMER)) return trimmed;
  return `${trimmed}\n\n${CLINICAL_DISCLAIMER}`;
}

function buildUserMessage(patientData) {
  const json = JSON.stringify(patientData, null, 2);
  return [
    "Summarize the following patient record for a clinician. Use ONLY the",
    `data below. If insufficient, respond EXACTLY with "${INSUFFICIENT_INFO}".`,
    "Always end with the required clinical disclaimer.",
    "",
    "PATIENT_DATA (JSON):",
    json,
  ].join("\n");
}

async function generateSummary(patientData) {
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
      return withDisclaimer(INSUFFICIENT_INFO);
    }
    return withDisclaimer(trimmed);
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
  CLINICAL_DISCLAIMER,
  INSUFFICIENT_INFO,
  FALLBACK_MESSAGE,
};
