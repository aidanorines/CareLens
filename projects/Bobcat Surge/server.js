const express = require("express");
const cors = require("cors");

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});