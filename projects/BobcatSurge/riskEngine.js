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

  // BMI check
  if (patient.vitals.bmi > 30) {
    risks.push({
      type: "High BMI",
      severity: "Medium",
      reason: "BMI is above 30 (obesity range)"
    });
  }

  // Diabetes + high BP combination
  if (
    patient.conditions &&
    patient.conditions.includes("diabetes") &&
    patient.vitals.bloodPressureSystolic > 130
  ) {
    risks.push({
      type: "Diabetes + Hypertension",
      severity: "High",
      reason: "Combination increases cardiovascular risk"
    });
  }

  return risks;
}

module.exports = { analyze };