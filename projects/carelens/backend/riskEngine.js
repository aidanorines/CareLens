function parseSystolic(vitals) {
  if (!vitals) return null;

  if (typeof vitals.bloodPressureSystolic === "number") {
    return Number.isFinite(vitals.bloodPressureSystolic) ? vitals.bloodPressureSystolic : null;
  }

  if (typeof vitals.bloodPressure === "string") {
    const [systolic] = vitals.bloodPressure.split("/");
    const value = Number.parseInt((systolic ?? "").trim(), 10);
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

function hasDiabetes(conditions) {
  if (!Array.isArray(conditions)) return false;
  return conditions.some(
    (c) => typeof c === "string" && c.toLowerCase().includes("diabetes")
  );
}

function analyze(patient) {
  const risks = [];
  const vitals = patient?.vitals ?? {};
  const systolic = parseSystolic(vitals);

  if (systolic != null && systolic > 130) {
    risks.push({
      type: "High Blood Pressure",
      severity: "High",
      reason: `Systolic BP ${systolic} is above 130`
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
  if (typeof vitals.bmi === "number" && vitals.bmi > 30) {
    risks.push({
      type: "High BMI",
      severity: "Medium",
      reason: "BMI is above 30 (obesity range)"
    });
  }

  // Diabetes + high BP combination
  if (
    hasDiabetes(patient.conditions) &&
    systolic != null &&
    systolic > 130
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

module.exports = { analyze, parseSystolic };