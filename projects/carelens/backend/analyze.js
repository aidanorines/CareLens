// Unified patient analysis pipeline for the CareLens API.
//
// Combines the rule-based risk engine with the AI / fallback summary
// generator and returns a single object that matches the shape the
// frontend's Assessment type expects:
//
//   {
//     riskScore: number,
//     riskLevel: "Low" | "Moderate" | "High",
//     flags: string[],
//     summary: string
//   }
//
// Sabid: in server.js you can do:
//   const { analyzePatient } = require("./analyze");
//   const result = await analyzePatient(patient);
//   res.json({ id, patientId: patient.id, ...result, createdAt: new Date().toISOString() });

const riskEngine = require("./riskEngine");
const { generateSummary } = require("./summaryGenerator");

async function analyzePatient(patient) {
  const { riskScore, riskLevel, flags } = riskEngine.analyze(patient);
  const summary = await generateSummary(patient);

  return {
    riskScore,
    riskLevel,
    flags,
    summary,
  };
}

module.exports = { analyzePatient };
