export type RiskLevel = "High" | "Moderate" | "Low";

export interface Patient {
  id: string;
  name: string;
  age: number;
  riskLevel: RiskLevel;
  conditionSummary: string;
  lastUpdated: string;
}
