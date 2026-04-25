import axios from "axios";
import { mockPatients } from "../data/mockPatients";
import type { Patient } from "../types/patient";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001",
  timeout: 5000,
});

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
