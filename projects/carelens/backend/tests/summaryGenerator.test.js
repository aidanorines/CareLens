// Realistic, runnable test for backend/summaryGenerator.js.
//
// Exercises three Synthea-inspired patient cases using the frontend
// Patient JSON shape. Prints each summary so a teammate (or judge) can see
// the AI output during a demo, and asserts the contract:
//
//   - generateSummary(patient) always resolves to a non-empty string
//   - The string is one of:
//       (a) A real AI summary in the required markdown structure
//       (b) The exact "I don't have enough information." line
//       (c) The deterministic system-note fallback (when HF_TOKEN is missing
//           or the API call fails)
//
// Run with: `node tests/summaryGenerator.test.js`
// Optionally: `npm run test:summary` (after package.json update).

const path = require("path");
const assert = require("assert").strict;

const {
  generateSummary,
  INSUFFICIENT_INFO,
  FALLBACK_MESSAGE,
} = require(path.join("..", "summaryGenerator"));

const cases = [
  {
    name: "High-risk elderly with diabetes, hypertension, CKD",
    patient: {
      id: "p-1001",
      name: "Elena Ramirez",
      age: 78,
      sex: "Female",
      conditions: [
        "Type 2 diabetes",
        "Hypertension",
        "Chronic kidney disease stage 3",
      ],
      medications: [
        "Metformin",
        "Lisinopril",
        "Atorvastatin",
        "Insulin glargine",
      ],
      vitals: {
        bloodPressure: "168/94",
        heartRate: 92,
        bmi: 31.4,
        temperature: 99.1,
        oxygenSaturation: 94,
      },
      encounters: [
        "2026-04-20: Emergency visit for dizziness and elevated blood pressure",
        "2026-03-28: Primary care follow-up for diabetes management",
        "2026-02-14: Nephrology consult for kidney function monitoring",
      ],
    },
  },
  {
    name: "Moderate-risk middle-aged with asthma + hyperlipidemia",
    patient: {
      id: "p-1002",
      name: "Marcus Chen",
      age: 52,
      sex: "Male",
      conditions: ["Asthma", "Hyperlipidemia", "Seasonal allergies"],
      medications: [
        "Albuterol inhaler",
        "Fluticasone inhaler",
        "Rosuvastatin",
      ],
      vitals: {
        bloodPressure: "132/84",
        heartRate: 78,
        bmi: 28.2,
        temperature: 98.4,
        oxygenSaturation: 96,
      },
      encounters: [
        "2026-04-12: Urgent care visit for wheezing after pollen exposure",
        "2026-03-05: Annual wellness visit with lipid panel review",
      ],
    },
  },
  {
    name: "Insufficient information (only id and name)",
    patient: {
      id: "p-9999",
      name: "Unknown Patient",
    },
  },
];

function classify(output) {
  if (output === FALLBACK_MESSAGE) return "fallback";
  if (output.trim() === INSUFFICIENT_INFO) return "insufficient_info";
  if (
    output.includes("Summary:") &&
    output.includes("Key Findings:") &&
    output.includes("Open Questions:")
  ) {
    return "ai_summary";
  }
  return "unknown";
}

async function runCase({ name, patient }) {
  console.log("\n=================================================");
  console.log(`Case: ${name}`);
  console.log("=================================================");

  const start = Date.now();
  const result = await generateSummary(patient);
  const elapsed = Date.now() - start;

  console.log(`Elapsed: ${elapsed}ms`);
  console.log("--- Output ---");
  console.log(result);
  console.log("--------------");

  assert.equal(typeof result, "string", "result must be a string");
  assert.ok(result.trim().length > 0, "result must be non-empty");

  const kind = classify(result);
  assert.ok(
    ["ai_summary", "insufficient_info", "fallback"].includes(kind),
    `result must be a valid summary kind, got: ${kind}`
  );

  if (kind === "ai_summary") {
    assert.ok(
      result.includes("Summary:"),
      "AI summary must include Summary: section"
    );
    assert.ok(
      result.includes("Key Findings:"),
      "AI summary must include Key Findings: section"
    );
    assert.ok(
      result.includes("Open Questions:"),
      "AI summary must include Open Questions: section"
    );
  }

  console.log(`Classified as: ${kind}`);
  return { name, kind, elapsed };
}

async function main() {
  console.log("CareLens summaryGenerator.test.js");
  console.log(
    `HF_TOKEN configured: ${
      process.env.HF_TOKEN && process.env.HF_TOKEN !== "hf_xxx_your_token_here"
        ? "yes"
        : "no (expecting deterministic fallback)"
    }`
  );

  const results = [];
  for (const c of cases) {
    try {
      const r = await runCase(c);
      results.push(r);
    } catch (err) {
      console.error(`\n[FAIL] ${c.name}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log("\n=================================================");
  console.log("Summary");
  console.log("=================================================");
  for (const r of results) {
    console.log(`- ${r.name} -> ${r.kind} (${r.elapsed}ms)`);
  }

  if (process.exitCode === 1) {
    console.log("\nOne or more cases failed.");
  } else {
    console.log("\nAll cases passed.");
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
