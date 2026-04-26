function normalizePatientData(rawData) {
  const data = parseInput(rawData);

  if (isCcdaDocument(data)) {
    return normalizeCCDA(data);
  }

  if (isFhirData(data)) {
    return normalizeFHIR(data);
  }

  return normalizeSimplifiedPatient(data);
}

function normalizeFHIR(rawData) {
  const data = parseInput(rawData);

  if (data?.resourceType === "Bundle") {
    return normalizeFhirBundle(data);
  }

  if (data?.resourceType === "Patient") {
    return normalizeFhirPatient(data);
  }

  return normalizeSimplifiedPatient(data);
}

function normalizeCCDA(rawData) {
  const data = parseInput(rawData);
  const document = findFirstByLocalName(data, "ClinicalDocument") || data || {};
  const patientRole = findFirstByLocalName(document, "patientRole") || {};
  const patient = findFirstByLocalName(patientRole, "patient") || {};
  const birthDate = parseCCDADate(attributeValue(findFirstByLocalName(patient, "birthTime")));
  const sections = findAllByLocalName(document, "section");

  return {
    id: ccdaId(patientRole) || generateId(),
    name: ccdaPatientName(findFirstByLocalName(patient, "name")) || "Unnamed Patient",
    age: calculateAge(birthDate),
    sex: formatCcdaSex(findFirstByLocalName(patient, "administrativeGenderCode")),
    conditions: uniqueStrings(extractCcdaSectionText(sections, ["problem", "condition"])),
    medications: uniqueStrings(extractCcdaMedications(sections)),
    vitals: extractCcdaVitals(sections),
    encounters: uniqueStrings(extractCcdaSectionText(sections, ["encounter"])),
  };
}

function normalizeFhirBundle(bundle) {
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

function isFhirData(data) {
  return data?.resourceType === "Bundle" || data?.resourceType === "Patient";
}

function isCcdaDocument(data) {
  return Boolean(findFirstByLocalName(data, "ClinicalDocument"));
}

function ccdaPatientName(nameNode) {
  const name = firstArrayItem(asArray(nameNode)) || {};
  const text = stringOrUndefined(name?.["#text"]);
  if (text) return text;

  return [
    nodeText(findFirstByLocalName(name, "given")),
    nodeText(findFirstByLocalName(name, "family")),
  ].filter(Boolean).join(" ");
}

function formatCcdaSex(genderNode) {
  const code = stringOrUndefined(attributeValue(genderNode)) || stringOrUndefined(genderNode);

  if (code?.toUpperCase() === "M") return "Male";
  if (code?.toUpperCase() === "F") return "Female";

  return formatSex(attributeDisplay(genderNode) || code);
}

function extractCcdaSectionText(sections, titleParts) {
  return sections
    .filter((section) => sectionMatches(section, titleParts))
    .flatMap((section) => findAllDisplayText(section));
}

function extractCcdaMedications(sections) {
  return sections
    .filter((section) => sectionMatches(section, ["medication"]))
    .flatMap((section) => {
      const medicationMaterials = findAllByLocalName(section, "manufacturedMaterial");
      const medicationDisplays = medicationMaterials.map((material) =>
        displayText(findFirstByLocalName(material, "code")),
      );
      return medicationDisplays.length > 0 ? medicationDisplays : findAllDisplayText(section);
    });
}

function extractCcdaVitals(sections) {
  const vitals = {};
  const vitalSections = sections.filter((section) => sectionMatches(section, ["vital"]));

  vitalSections.flatMap((section) => findAllByLocalName(section, "observation")).forEach((observation) => {
    const label = displayText(findFirstByLocalName(observation, "code")).toLowerCase();
    const valueNode = findFirstByLocalName(observation, "value");
    const value = numericOrUndefined(attributeValue(valueNode) || valueNode);

    if (value === undefined) return;

    if (label.includes("systolic")) {
      const diastolic = findSiblingVitalValue(vitalSections, "diastolic");
      vitals.bloodPressure = diastolic === undefined ? String(value) : `${value}/${diastolic}`;
    } else if (label.includes("diastolic") && !vitals.bloodPressure) {
      vitals.bloodPressure = String(value);
    } else if (label.includes("heart rate")) {
      vitals.heartRate = value;
    } else if (label.includes("body mass index") || label.includes("bmi")) {
      vitals.bmi = value;
    } else if (label.includes("temperature")) {
      vitals.temperature = value;
    } else if (label.includes("oxygen")) {
      vitals.oxygenSaturation = value;
    }
  });

  return vitals;
}

function findSiblingVitalValue(sections, labelPart) {
  const observation = sections
    .flatMap((section) => findAllByLocalName(section, "observation"))
    .find((item) => displayText(findFirstByLocalName(item, "code")).toLowerCase().includes(labelPart));

  const valueNode = findFirstByLocalName(observation, "value");
  return numericOrUndefined(attributeValue(valueNode) || valueNode);
}

function sectionMatches(section, titleParts) {
  const title = nodeText(findFirstByLocalName(section, "title")).toLowerCase();
  const code = displayText(findFirstByLocalName(section, "code")).toLowerCase();
  return titleParts.some((part) => title.includes(part) || code.includes(part));
}

function findAllDisplayText(value) {
  return findAllByLocalName(value, "code")
    .concat(findAllByLocalName(value, "value"))
    .map((node) => displayText(node))
    .filter(Boolean);
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

function displayText(node) {
  return (
    stringOrUndefined(attributeDisplay(node)) ||
    stringOrUndefined(attributeValue(node)) ||
    stringOrUndefined(node?.displayName) ||
    stringOrUndefined(node?.display) ||
    stringOrUndefined(node?.["#text"]) ||
    stringOrUndefined(node?.code) ||
    ""
  );
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

function parseCCDADate(value) {
  const text = stringOrUndefined(value);
  if (!text) return undefined;

  const match = text.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return text;

  const [, year, month, day] = match;
  return `${year}-${month}-${day}`;
}

function ccdaId(patientRole) {
  const idNode = findFirstByLocalName(patientRole, "id");
  return attributeValue(idNode);
}

function attributeValue(node) {
  if (Array.isArray(node)) return attributeValue(node[0]);
  if (node && typeof node === "object") {
    return node["@_value"] || node["@_code"] || node["@_extension"] || node["@_root"] || node.value;
  }
  return node;
}

function attributeDisplay(node) {
  if (Array.isArray(node)) return attributeDisplay(node[0]);
  if (node && typeof node === "object") {
    return node["@_displayName"] || node.displayName || node["@_name"] || node.name;
  }
  return undefined;
}

function nodeText(node) {
  if (Array.isArray(node)) return node.map(nodeText).filter(Boolean).join(" ");
  if (node && typeof node === "object") return stringOrUndefined(node["#text"]) || displayText(node);
  return stringOrUndefined(node) || "";
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

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function findAllByKey(value, key) {
  const matches = [];

  walk(value, (node) => {
    if (!node || typeof node !== "object") return;
    const child = node[key];
    if (child !== undefined) matches.push(...asArray(child));
  });

  return matches;
}

function findFirstByLocalName(value, localName) {
  return findAllByLocalName(value, localName)[0];
}

function findAllByLocalName(value, localName) {
  const matches = [];

  walk(value, (node) => {
    if (!node || typeof node !== "object") return;

    Object.entries(node).forEach(([key, child]) => {
      if (keyLocalName(key).toLowerCase() === localName.toLowerCase()) {
        matches.push(...asArray(child));
      }
    });
  });

  return matches;
}

function keyLocalName(key) {
  return String(key).split(":").pop();
}

function walk(value, visitor) {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visitor));
    return;
  }

  if (!value || typeof value !== "object") return;

  visitor(value);
  Object.values(value).forEach((child) => walk(child, visitor));
}

function generateId() {
  return `p-${Date.now()}`;
}

module.exports = { normalizePatientData };
