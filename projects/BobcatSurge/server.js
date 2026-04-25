const express = require("express");
const cors = require("cors");
const riskEngine = require("./riskEngine");
const summaryGenerator = require("./summaryGenerator");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "CareLens backend is running",
    status: "OK"
  });
});

app.get("/patients", (req, res) => {
  res.json({
    message: "Patients route is working",
    patients: []
  });
});

app.post("/patients/analyze", (req, res) => {
  const patientData = req.body;

  if (!patientData.age || !patientData.vitals) {
    return res.status(400).json({
      error: "Missing required patient data"
    });
  }

  const analysis = riskEngine.analyze(patientData);

  const summary = summaryGenerator.generate(patientData, analysis.flags);

  res.status(201).json({
    message: "Patient analyzed successfully",
    patient: patientData,
    riskScore: analysis.score,
    riskLevel: analysis.level,
    riskFlags: analysis.flags,
    summary: summary
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});