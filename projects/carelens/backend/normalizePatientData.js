function normalizePatientData(rawData) {
  const data = parseInput(rawData);

  if (data?.resourceType === "Bundle") {
    return normalizeBundle(data);
  }

  if (data?.resourceType === "Patient") {
    return normalizeFhirPatient(data);
  }

  return normalizeSimplifiedPatient(data);
}

function normalizeBundle(bundle) {
  const resources = Array.isArray(bundle?.entry)
    ? bundle.entry.map((entry) => entry?.resource).filter(Boolean)
    : [];
  const patientResource = resources.find((resource) => resource?.resourceType === "Patient");
  const patient = normalizeFhirPatient(patientResource || {});

  const observations = resources.filter((resource) => resource?.resourceType === "Observation");

  return {
    ...patient,
    conditions: uniqueStrings(
      resources
        .filter((resource) => resource?.resourceType === "Condition")
        .map((condition) => codeableConceptText(condition?.code)),
    ),
    medications: uniqueStrings(
      resources
        .filter((resource) =>
          ["MedicationRequest", "MedicationStatement"].includes(resource?.resourceType),
        )
        .map((medication) =>
          codeableConceptText(medication?.medicationCodeableConcept) ||
          medication?.medicationReference?.display,
        ),
    ),
    vitals: extractVitals(observations),
    encounters: uniqueStrings(
      resources
        .filter((resource) => resource?.resourceType === "Encounter")
        .map((encounter) => encounterText(encounter)),
    ),
  };
}

function normalizeFhirPatient(patient) {
  const birthDate = stringOrUndefined(patient?.birthDate);

  return {
    id: stringOrUndefined(patient?.id) || identifierValue(patient?.identifier) || generateId(),
    name: patientName(patient) || "Unnamed Patient",
    age: calculateAge(birthDate),
    sex: formatSex(patient?.gender),
    conditions: [],
    medications: [],
    vitals: {},
    encounters: [],
  };
}

function normalizeSimplifiedPatient(data) {
  const birthDate = stringOrUndefined(data?.birthDate) || stringOrUndefined(data?.birth_date);

  return {
    id: stringOrUndefined(data?.id) || stringOrUndefined(data?.fhir_id) || generateId(),
    name:
      stringOrUndefined(data?.name) ||
      [data?.first_name, data?.last_name].filter(Boolean).join(" ") ||
      "Unnamed Patient",
    age: numericOrFallback(data?.age, calculateAge(birthDate)),
    sex: formatSex(data?.sex || data?.gender),
    conditions: uniqueStrings(data?.conditions),
    medications: uniqueStrings(data?.medications),
    vitals: normalizeVitals(data?.vitals),
    encounters: uniqueStrings(data?.encounters),
  };
}

function parseInput(rawData) {
  if (typeof rawData !== "string") {
    return rawData || {};
  }

  try {
    return JSON.parse(rawData);
  } catch {
    return {};
  }
}

function patientName(patient) {
  const names = Array.isArray(patient?.name) ? patient.name : [];
  const primaryName = names[0];

  if (!primaryName) return "";
  if (primaryName.text) return primaryName.text;

  return [primaryName.given, primaryName.family]
    .flat()
    .filter(Boolean)
    .join(" ");
}

function identifierValue(identifiers) {
  if (!Array.isArray(identifiers)) return "";
  return identifiers.find((identifier) => identifier?.value)?.value || "";
}

function extractVitals(observations) {
  const vitals = {};

  observations.forEach((observation) => {
    const label = codeableConceptText(observation?.code).toLowerCase();
    const codes = codeableConceptCodes(observation?.code);

    if (isBloodPressure(label, codes)) {
      const bloodPressure = extractBloodPressure(observation);
      if (bloodPressure) vitals.bloodPressure = bloodPressure;
      return;
    }

    const value = observationNumber(observation);
    if (value === undefined) return;

    if (matchesCode(label, codes, ["heart rate"], ["8867-4"])) {
      vitals.heartRate = value;
    } else if (matchesCode(label, codes, ["body mass index", "bmi"], ["39156-5"])) {
      vitals.bmi = value;
    } else if (matchesCode(label, codes, ["body temperature", "temperature"], ["8310-5"])) {
      vitals.temperature = value;
    } else if (
      matchesCode(label, codes, ["oxygen saturation", "spo2"], ["59408-5", "2708-6"])
    ) {
      vitals.oxygenSaturation = value;
    }
  });

  return vitals;
}

function extractBloodPressure(observation) {
  const components = Array.isArray(observation?.component) ? observation.component : [];

  if (components.length === 0) {
    const value = observationNumber(observation);
    return value === undefined ? undefined : String(value);
  }

  const systolic = components.find((component) => {
    const label = codeableConceptText(component?.code).toLowerCase();
    const codes = codeableConceptCodes(component?.code);
    return matchesCode(label, codes, ["systolic"], ["8480-6"]);
  });
  const diastolic = components.find((component) => {
    const label = codeableConceptText(component?.code).toLowerCase();
    const codes = codeableConceptCodes(component?.code);
    return matchesCode(label, codes, ["diastolic"], ["8462-4"]);
  });
  const systolicValue = quantityNumber(systolic?.valueQuantity);
  const diastolicValue = quantityNumber(diastolic?.valueQuantity);

  if (systolicValue === undefined && diastolicValue === undefined) return undefined;
  if (systolicValue === undefined) return String(diastolicValue);
  if (diastolicValue === undefined) return String(systolicValue);

  return `${systolicValue}/${diastolicValue}`;
}

function normalizeVitals(vitals) {
  const source = vitals && typeof vitals === "object" ? vitals : {};

  return {
    bloodPressure: stringOrUndefined(source.bloodPressure),
    heartRate: numericOrUndefined(source.heartRate),
    bmi: numericOrUndefined(source.bmi),
    temperature: numericOrUndefined(source.temperature),
    oxygenSaturation: numericOrUndefined(source.oxygenSaturation),
  };
}

function encounterText(encounter) {
  return (
    codeableConceptText(firstArrayItem(encounter?.type)) ||
    encounter?.class?.display ||
    encounter?.class?.code ||
    codeableConceptText(firstArrayItem(encounter?.reasonCode))
  );
}

function codeableConceptText(concept) {
  if (!concept) return "";
  if (concept.text) return concept.text;

  const coding = firstArrayItem(concept.coding);
  return coding?.display || coding?.code || "";
}

function codeableConceptCodes(concept) {
  if (!Array.isArray(concept?.coding)) return [];
  return concept.coding.map((coding) => String(coding?.code || "").toLowerCase()).filter(Boolean);
}

function observationNumber(observation) {
  return quantityNumber(observation?.valueQuantity);
}

function quantityNumber(quantity) {
  return numericOrUndefined(quantity?.value);
}

function isBloodPressure(label, codes) {
  return matchesCode(label, codes, ["blood pressure"], ["85354-9", "55284-4"]);
}

function matchesCode(label, codes, labelParts, targetCodes) {
  return (
    labelParts.some((part) => label.includes(part)) ||
    targetCodes.some((code) => codes.includes(code.toLowerCase()))
  );
}

function calculateAge(birthDate) {
  if (!birthDate) return 0;

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const birthdayPassed =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());

  if (!birthdayPassed) age -= 1;
  return age;
}

function formatSex(value) {
  const sex = stringOrUndefined(value);
  if (!sex) return "Unknown";
  return sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase();
}

function uniqueStrings(values) {
  const list = Array.isArray(values) ? values : [];
  return [...new Set(list.map((value) => stringOrUndefined(value)).filter(Boolean))];
}

function numericOrFallback(value, fallback) {
  return numericOrUndefined(value) ?? fallback;
}

function numericOrUndefined(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stringOrUndefined(value) {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function firstArrayItem(value) {
  return Array.isArray(value) ? value[0] : undefined;
}

function generateId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { normalizePatientData };
