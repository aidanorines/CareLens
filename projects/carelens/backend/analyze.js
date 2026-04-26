// Unified patient analysis pipeline for the CareLens API.
//
// Combines the rule-based risk engine with the AI / fallback summary
// generator and returns a single object that matches the shape the
// frontend's Assessment type expects:
//
//   {
//     riskScore: number,
//     riskLevel: "Low" | "Moderate" | "High",
//     flags: <risk engine flag objects>,
//     summary: string
//   }
//
// The risk context (level, score, flags) is passed into generateSummary so
// the AI prompt and the deterministic fallback can both reference it.

const riskEngine = require("./riskEngine");
const { generateSummary } = require("./summaryGenerator");

async function analyzePatient(patient) {
  const { score, level, flags } = riskEngine.analyze(patient);
  const riskLevel = level === "Medium" ? "Moderate" : level;

  const assessmentInput = {
    riskLevel,
    riskScore: score,
    flags,
  };

  const summary = await generateSummary(patient, assessmentInput);

  return {
    riskScore: score,
    riskLevel,
    flags,
    summary,
  };
}

module.exports = { analyzePatient };
