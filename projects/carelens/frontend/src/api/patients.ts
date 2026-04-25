import axios from "axios";
import { mockAssessments, mockPatients } from "../data/mockPatients";
import type { Assessment, Patient } from "../types/patient";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 5000,
});

export async function getPatients(): Promise<Patient[]> {
  try {
    // API integration point: replace the mock fallback once the backend contract is stable.
    const response = await api.get<Patient[]>("/patients");
    return response.data;
  } catch {
    return mockPatients;
  }
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  try {
    // API integration point: dashboard views can move from direct mock reads to this helper later.
    const response = await api.get<Patient>(`/patients/${id}`);
    return response.data;
  } catch {
    return mockPatients.find((patient) => patient.id === id);
  }
}

export async function uploadPatient(file: File): Promise<Patient> {
  const formData = new FormData();
  formData.append("file", file);

  // API integration point: wire this into an upload flow when the UI is ready.
  const response = await api.post<Patient>("/patients/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function analyzePatient(id: string): Promise<Assessment> {
  // API integration point: connect this to the patient dashboard action when analysis is enabled.
  const response = await api.post<Assessment>(`/patients/${id}/analyze`);
  return response.data;
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
