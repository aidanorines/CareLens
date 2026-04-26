function parseBloodPressure(value) {
  const match = String(value || "").match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  return {
    systolic: match ? Number(match[1]) : undefined,
    diastolic: match ? Number(match[2]) : undefined,
  };
}

function parseSystolic(vitals) {
  if (!vitals) return null;

  if (typeof vitals.bloodPressureSystolic === "number") {
    return Number.isFinite(vitals.bloodPressureSystolic)
      ? vitals.bloodPressureSystolic
      : null;
  }

  if (typeof vitals.bloodPressure === "string") {
    const { systolic } = parseBloodPressure(vitals.bloodPressure);
    return Number.isFinite(systolic) ? systolic : null;
  }

  return null;
}

function hasCondition(conditions, keyword) {
  return conditions.some((condition) => condition.includes(keyword));
}

function hasDiabetes(conditions) {
  return hasCondition(conditions, "diabetes");
}

function analyze(patient = {}) {
  const vitals = patient.vitals || {};
  const conditions = Array.isArray(patient.conditions)
    ? patient.conditions.map((c) => String(c).toLowerCase())
    : [];
  const encounters = Array.isArray(patient.encounters)
    ? patient.encounters.map((e) => String(e).toLowerCase())
    : [];

  const risks = [];

  const systolic = parseSystolic(vitals);
  const { diastolic } = parseBloodPressure(vitals.bloodPressure);
  const bmi = Number(vitals.bmi);
  const heartRate = Number(vitals.heartRate);
  const oxygenSaturation = Number(vitals.oxygenSaturation);

  if ((systolic && systolic >= 140) || (diastolic && diastolic >= 90)) {
    risks.push({
      type: "High Blood Pressure",
      severity: "High",
      reason: "Blood pressure is in a high range",
    });
  }

  if (Number(patient.age) >= 65) {
    risks.push({
      type: "High Risk Age",
      severity: "Medium",
      reason: "Patient is 65 or older",
    });
  }

  if (Number.isFinite(bmi) && bmi >= 30) {
    risks.push({
      type: "Elevated BMI",
      severity: "Medium",
      reason: "BMI is in the elevated range",
    });
  }

  if (hasDiabetes(conditions) && hasCondition(conditions, "hypertension")) {
    risks.push({
      type: "Diabetes + Hypertension",
      severity: "High",
      reason: "Diabetes and hypertension together increase cardiovascular risk",
    });
  } else if (hasDiabetes(conditions) && systolic && systolic >= 140) {
    risks.push({
      type: "Diabetes + High Blood Pressure",
      severity: "High",
      reason: "Diabetes with high blood pressure increases cardiovascular risk",
    });
  }

  if (hasCondition(conditions, "kidney") && hasDiabetes(conditions)) {
    risks.push({
      type: "Kidney Disease Complication Risk",
      severity: "High",
      reason: "Kidney disease with diabetes may increase complication risk",
    });
  }

  if (encounters.some((encounter) => encounter.includes("emergency"))) {
    risks.push({
      type: "Recent Emergency Care Use",
      severity: "Medium",
      reason: "Record includes an emergency care encounter",
    });
  }

  if (Number.isFinite(oxygenSaturation) && oxygenSaturation < 92) {
    risks.push({
      type: "Low Oxygen Saturation",
      severity: "High",
      reason: "Oxygen saturation is below 92%",
    });
  }

  if (Number.isFinite(heartRate) && heartRate > 100) {
    risks.push({
      type: "Elevated Heart Rate",
      severity: "Medium",
      reason: "Heart rate is above 100 bpm",
    });
  }

  const score = risks.reduce((total, risk) => {
    if (risk.severity === "High") return total + 30;
    if (risk.severity === "Medium") return total + 15;
    return total + 5;
  }, 0);

  let level = "Low";
  if (score >= 70) level = "High";
  else if (score >= 35) level = "Moderate";

  return { score, level, flags: risks };
}

module.exports = { analyze, parseSystolic, parseBloodPressure };
