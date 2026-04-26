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
    Array.isArray(patient.conditions) &&
    patient.conditions.some((condition) => String(condition).toLowerCase().includes("diabetes")) &&
    patient.vitals.bloodPressureSystolic > 130
  ) {
    risks.push({
      type: "Diabetes + Hypertension",
      severity: "High",
      reason: "Combination increases cardiovascular risk"
    });
  }

  let score = 0;

  risks.forEach((risk) => {
    if (risk.severity === "High") score += 30;
    if (risk.severity === "Medium") score += 15;
    if (risk.severity === "Low") score += 5;
  });

  let level = "Low";

  if (score >= 60) {
    level = "High";
  } else if (score >= 30) {
    level = "Medium";
  }

  return {
    score: score,
    level: level,
    flags: risks
  };

}

module.exports = { analyze };
