import type { Assessment, Patient } from "../types/patient";

// Synthetic demo data only. These records do not represent real patients.
export const mockPatients: Patient[] = [
  {
    id: "p-1001",
    name: "Elena Ramirez",
    age: 78,
    sex: "Female",
    conditions: ["Type 2 diabetes", "Hypertension", "Chronic kidney disease stage 3"],
    medications: ["Metformin", "Lisinopril", "Atorvastatin", "Insulin glargine"],
    vitals: {
      bloodPressure: "168/94",
      heartRate: 92,
      bmi: 31.4,
      temperature: 99.1,
      oxygenSaturation: 94,
    },
    encounters: [
      "2026-04-20: Emergency visit for dizziness and elevated blood pressure",
      "2026-03-28: Primary care follow-up for diabetes management",
      "2026-02-14: Nephrology consult for kidney function monitoring",
    ],
  },
  {
    id: "p-1002",
    name: "Marcus Chen",
    age: 52,
    sex: "Male",
    conditions: ["Asthma", "Hyperlipidemia", "Seasonal allergies"],
    medications: ["Albuterol inhaler", "Fluticasone inhaler", "Rosuvastatin"],
    vitals: {
      bloodPressure: "132/84",
      heartRate: 78,
      bmi: 28.2,
      temperature: 98.4,
      oxygenSaturation: 96,
    },
    encounters: [
      "2026-04-12: Urgent care visit for wheezing after pollen exposure",
      "2026-03-05: Annual wellness visit with lipid panel review",
    ],
  },
  {
    id: "p-1003",
    name: "Nadia Patel",
    age: 34,
    sex: "Female",
    conditions: ["Migraine without aura"],
    medications: ["Sumatriptan as needed"],
    vitals: {
      bloodPressure: "116/72",
      heartRate: 66,
      bmi: 22.8,
      temperature: 98.2,
      oxygenSaturation: 99,
    },
    encounters: [
      "2026-04-02: Routine primary care visit",
      "2026-01-18: Neurology follow-up for stable migraine pattern",
    ],
  },
];

export const mockAssessments: Assessment[] = [
  {
    id: "a-9001",
    patientId: "p-1001",
    riskLevel: "High",
    riskScore: 88,
    flags: [
      "Elevated blood pressure with recent emergency visit",
      "Diabetes with chronic kidney disease increases complication risk",
      "Multiple cardiometabolic medications require adherence review",
    ],
    summary:
      "Older adult with diabetes, hypertension, and kidney disease has high near-term risk due to uncontrolled blood pressure, recent acute care use, and complex medication management needs.",
    createdAt: "2026-04-24T09:30:00Z",
  },
  {
    id: "a-9002",
    patientId: "p-1002",
    riskLevel: "Moderate",
    riskScore: 56,
    flags: [
      "Recent asthma flare requiring urgent care",
      "BMI and lipid history support cardiometabolic monitoring",
    ],
    summary:
      "Moderate risk based on a recent respiratory exacerbation and chronic hyperlipidemia, with stable vitals and no recent hospitalization documented.",
    createdAt: "2026-04-24T13:15:00Z",
  },
  {
    id: "a-9003",
    patientId: "p-1003",
    riskLevel: "Low",
    riskScore: 18,
    flags: ["Vitals within expected range", "Stable migraine pattern without acute encounters"],
    summary:
      "Low risk synthetic profile with stable chronic migraine history, normal vital signs, and routine outpatient follow-up only.",
    createdAt: "2026-04-23T16:45:00Z",
  },
];
