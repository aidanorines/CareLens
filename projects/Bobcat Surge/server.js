const express = require("express");
const cors = require("cors");
const riskEngine = require("./riskEngine");

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

app.post("/patients/upload", (req, res) => {
  const patientData = req.body;
  const risks = riskEngine.analyze(patientData);

  res.status(201).json({
    message: "Patient analyzed successfully",
    patient: patientData,
    risks: risks
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});