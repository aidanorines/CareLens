import axios from "axios";
import { mockAssessments, mockPatients } from "../data/mockPatients";
import type { Assessment, Patient } from "../types/patient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
});

export interface UploadPatientResponse {
  patient: Patient;
  assessment: Assessment;
}

type PatientUpload = Partial<Omit<Patient, "id">> & {
  id?: string;
};

export async function getPatients(): Promise<Patient[]> {
  try {
    const response = await api.get<Patient[]>("/patients");
    return response.data;
  } catch {
    return mockPatients;
  }
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  try {
    const response = await api.get<Patient>(`/patients/${id}`);
    return response.data;
  } catch {
    return mockPatients.find((patient) => patient.id === id);
  }
}

export async function getAssessments(): Promise<Assessment[]> {
  try {
    const response = await api.get<Assessment[]>("/assessments");
    return response.data;
  } catch {
    return mockAssessments;
  }
}

export async function getAssessmentByPatientId(
  patientId: string,
): Promise<Assessment | undefined> {
  try {
    const response = await api.get<Assessment>(`/patients/${patientId}/assessment`);
    return response.data;
  } catch {
    return mockAssessments.find((assessment) => assessment.patientId === patientId);
  }
}

export async function uploadPatient(patient: PatientUpload | File): Promise<UploadPatientResponse> {
  try {
    const body = patient instanceof File ? fileUploadFormData(patient) : patient;
    const response = await api.post<UploadPatientResponse>("/patients/upload", body);
    return response.data;
  } catch {
    const fallbackPatient = normalizePatientUpload(patient);

    return {
      patient: fallbackPatient,
      assessment: buildFallbackAssessment(fallbackPatient),
    };
  }
}

export async function analyzePatient(patientId: string): Promise<Assessment | undefined> {
  try {
    const response = await api.post<Assessment>(`/patients/${patientId}/analyze`, {});
    return response.data;
  } catch {
    return (
      mockAssessments.find((assessment) => assessment.patientId === patientId) ??
      buildFallbackAssessment(mockPatients.find((patient) => patient.id === patientId))
    );
  }
}

function fileUploadFormData(file: File): FormData {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

function normalizePatientUpload(patient: PatientUpload | File): Patient {
  if (patient instanceof File) {
    return {
      id: `local-${Date.now()}`,
      name: patient.name.replace(/\.(json|xml)$/i, "") || "Uploaded Patient",
      age: 0,
      sex: "Unknown",
      conditions: [],
      medications: [],
      vitals: {},
      encounters: [],
    };
  }

  return {
    id: patient.id || `local-${Date.now()}`,
    name: patient.name || "Uploaded Patient",
    age: Number(patient.age) || 0,
    sex: patient.sex || "Unknown",
    conditions: Array.isArray(patient.conditions) ? patient.conditions : [],
    medications: Array.isArray(patient.medications) ? patient.medications : [],
    vitals: patient.vitals || {},
    encounters: Array.isArray(patient.encounters) ? patient.encounters : [],
  };
}

function buildFallbackAssessment(patient?: Patient): Assessment {
  const patientId = patient?.id ?? `local-${Date.now()}`;

  return {
    id: `local-assessment-${Date.now()}`,
    patientId,
    riskLevel: "Low",
    riskScore: 0,
    flags: ["Backend unavailable; showing local fallback assessment"],
    summary: "Backend analysis is unavailable. This local fallback keeps the demo flow working.",
    createdAt: new Date().toISOString(),
  };
}
