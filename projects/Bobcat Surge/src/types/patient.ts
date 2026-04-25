export type RiskLevel = "Low" | "Moderate" | "High";

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: string;
  conditions: string[];
  medications: string[];
  vitals: {
    bloodPressure?: string;
    heartRate?: number;
    bmi?: number;
    temperature?: number;
    oxygenSaturation?: number;
  };
  encounters?: string[];
}

export interface Assessment {
  id: string;
  patientId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  flags: string[];
  summary: string;
  createdAt: string;
}
