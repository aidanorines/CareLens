require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { XMLParser } = require("fast-xml-parser");
const { analyzePatient } = require("./analyze");
const { parseSystolic } = require("./riskEngine");
const { normalizePatientData } = require("./normalizePatientData");

const app = express();
const PORT = process.env.PORT || 5050;
const upload = multer({ storage: multer.memoryStorage() });
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

const patients = [
  {
    id: "p-1001",
    name: "Elena Ramirez",
    age: 78,
    sex: "Female",
    conditions: ["Type 2 diabetes", "Hypertension", "Chronic kidney disease stage 3"],
    medications: ["Metformin", "Lisinopril", "Atorvastatin", "Insulin glargine"],
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
  {
    id: "p-1002",
    name: "Marcus Chen",
    age: 52,
    sex: "Male",
    conditions: ["Asthma", "Hyperlipidemia", "Seasonal allergies"],
    medications: ["Albuterol inhaler", "Fluticasone inhaler", "Rosuvastatin"],
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
  {
    id: "p-1003",
    name: "Nadia Patel",
    age: 34,
    sex: "Female",
    conditions: ["Migraine without aura"],
    medications: ["Sumatriptan as needed"],
    vitals: {
      bloodPressure: "116/72",
      heartRate: 66,
      bmi: 22.8,
      temperature: 98.2,
      oxygenSaturation: 99,
    },
    encounters: [
      "2026-04-02: Routine primary care visit",
      "2026-01-18: Neurology follow-up for stable migraine pattern",
    ],
  },
];

const assessments = [];

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "CareLens backend is running",
    status: "OK",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "CareLens Backend",
  });
});

app.get("/api/patients", (req, res) => {
  res.json(patients);
});

app.get("/api/patients/:id", (req, res) => {
  const patient = patients.find((item) => item.id === req.params.id);

  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  res.json(patient);
});

app.get("/api/assessments", (req, res) => {
  res.json(assessments);
});

app.get("/api/patients/:id/assessment", (req, res) => {
  const assessment = assessments.findLast((item) => item.patientId === req.params.id);

  if (!assessment) {
    return res.status(404).json({ error: "Assessment not found" });
  }

  res.json(assessment);
});

app.post("/api/patients/upload", upload.single("file"), async (req, res) => {
  let rawData = req.body;

  try {
    if (req.file) {
      rawData = parseUploadedPatientFile(req.file);
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const patient = ensurePatientId(normalizePatientData(rawData));
  patients.push(patient);

  try {
    const assessment = await buildAssessment(patient, `a-${Date.now()}`);
    assessments.push(assessment);
    res.status(201).json({ patient, assessment });
  } catch (error) {
    console.error("[patients/upload] Failed to analyze uploaded patient:", error);
    res.status(500).json({ error: "Failed to analyze uploaded patient" });
  }
});

app.post("/api/patients/:id/analyze", async (req, res) => {
  const existing = patients.find((item) => item.id === req.params.id);

  if (!existing) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const merged = { ...existing, ...req.body };
  const systolic = parseSystolic(merged.vitals);

  if (
    merged.age == null ||
    !merged.vitals ||
    systolic == null ||
    merged.vitals.bmi == null
  ) {
    return res.status(400).json({
      error: "Missing or invalid patient data",
      requiredFields: [
        "age",
        "vitals.bloodPressureSystolic (number) or vitals.bloodPressure (\"SYS/DIA\")",
        "vitals.bmi",
      ],
    });
  }

  try {
    const assessment = await buildAssessment(merged, `a-${Date.now()}`);
    assessments.push(assessment);
    res.status(201).json(assessment);
  } catch (error) {
    console.error("[patients/:id/analyze] Failed to analyze patient:", error);
    res.status(500).json({ error: "Failed to analyze patient" });
  }
});

precomputeSeedAssessments().catch((error) => {
  console.error("[startup] Failed to pre-compute seed assessments:", error);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function precomputeSeedAssessments() {
  await Promise.all(
    patients.map(async (patient, index) => {
      const assessment = await buildAssessment(patient, `a-900${index + 1}`);
      assessments.push(assessment);
    }),
  );
}

async function buildAssessment(patient, id) {
  const result = await analyzePatient(patient);
  const flags = (result.flags || [])
    .map((flag) =>
      typeof flag === "string" ? flag : flag.reason || flag.type,
    )
    .filter(Boolean);

  return {
    id,
    patientId: patient.id,
    riskLevel: result.riskLevel,
    riskScore: result.riskScore,
    flags,
    summary: result.summary,
    createdAt: new Date().toISOString(),
  };
}

function parseUploadedPatientFile(file) {
  const filename = String(file.originalname || "").toLowerCase();
  const content = file.buffer.toString("utf8");

  if (filename.endsWith(".json")) {
    try {
      return JSON.parse(content);
    } catch {
      throw new Error("Invalid JSON patient record.");
    }
  }

  if (filename.endsWith(".xml")) {
    try {
      return xmlParser.parse(content);
    } catch {
      throw new Error("Invalid XML patient record.");
    }
  }

  throw new Error("Only FHIR JSON or C-CDA XML patient records are supported.");
}

function ensurePatientId(patient) {
  return {
    ...patient,
    id: patient.id || `p-${Date.now()}`,
  };
}
