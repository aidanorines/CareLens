const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { XMLParser } = require("fast-xml-parser");
const riskEngine = require("./riskEngine");
const summaryGenerator = require("./summaryGenerator");
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

const assessments = patients.map((patient, index) => buildAssessment(patient, `a-900${index + 1}`));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "CareLens backend is running",
    status: "OK"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "CareLens Backend"
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
  const assessment = assessments.find((item) => item.patientId === req.params.id);

  if (!assessment) {
    return res.status(404).json({ error: "Assessment not found" });
  }

  res.json(assessment);
});

app.post("/api/patients/upload", upload.single("file"), (req, res) => {
  let rawData = req.body;

  try {
    if (req.file) {
      rawData = parseUploadedPatientFile(req.file);
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const patient = normalizePatientData(rawData);
  patients.push(patient);

  const assessment = buildAssessment(patient, `a-${Date.now()}`);
  assessments.push(assessment);

  res.status(201).json({ patient, assessment });
});

app.post("/api/patients/:id/analyze", (req, res) => {
  const patient = patients.find((item) => item.id === req.params.id);

  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const assessment = buildAssessment({ ...patient, ...req.body }, `a-${Date.now()}`);
  assessments.push(assessment);

  res.status(201).json(assessment);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function buildAssessment(patient, id) {
  const analysisInput = toRiskEnginePatient(patient);
  const analysis = riskEngine.analyze(analysisInput);
  const flags = analysis.flags.map((flag) => flag.reason);

  return {
    id,
    patientId: patient.id,
    riskLevel: analysis.level === "Medium" ? "Moderate" : analysis.level,
    riskScore: analysis.score,
    flags,
    summary: summaryGenerator.generate(analysisInput, analysis.flags),
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

  throw new Error("Only JSON or XML patient records are supported.");
}

function toRiskEnginePatient(patient) {
  const systolic = Number.parseInt(String(patient.vitals?.bloodPressure ?? ""), 10);

  return {
    ...patient,
    vitals: {
      ...patient.vitals,
      bloodPressureSystolic: Number.isNaN(systolic) ? 0 : systolic,
      bmi: Number(patient.vitals?.bmi) || 0,
    },
  };
}
