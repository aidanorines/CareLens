import type { Patient } from "../types/patient";

export const mockPatients: Patient[] = [
  {
    id: "p-1001",
    name: "Maria Thompson",
    age: 67,
    riskLevel: "High",
    conditionSummary: "Recent CHF exacerbation with medication adherence concerns.",
    lastUpdated: "2026-04-24T09:30:00Z",
  },
  {
    id: "p-1002",
    name: "Daniel Kim",
    age: 54,
    riskLevel: "Moderate",
    conditionSummary: "Type 2 diabetes with elevated HbA1c and missed follow-up.",
    lastUpdated: "2026-04-24T13:15:00Z",
  },
  {
    id: "p-1003",
    name: "Aisha Patel",
    age: 39,
    riskLevel: "Low",
    conditionSummary: "Post-discharge recovery progressing without acute concerns.",
    lastUpdated: "2026-04-23T16:45:00Z",
  },
];
