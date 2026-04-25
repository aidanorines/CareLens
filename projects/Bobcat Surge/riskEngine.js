function analyze(patient) {
  const risks = [];

  if (patient.vitals.bloodPressureSystolic > 130) {
    risks.push({
      type: "High Blood Pressure",
      severity: "High",
      reason: "Systolic BP is above 130"
    });
  }

  if (patient.age > 60) {
    risks.push({
      type: "High Risk Age",
      severity: "Medium",
      reason: "Patient is above 60"
    });
  }

  return risks;
}

module.exports = { analyze };