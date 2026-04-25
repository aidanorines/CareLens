function generate(patient, risks) {
  if (risks.length === 0) {
    return "Patient shows no major risk indicators.";
  }

  const riskTypes = risks.map(r => r.type).join(", ");

  return `Patient has ${risks.length} risk factors including ${riskTypes}.`;
}

module.exports = { generate };