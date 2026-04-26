import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileJson,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getAssessments, getPatients, uploadPatient } from "../api/patients";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import type { Assessment, Patient, RiskLevel } from "../types/patient";

const riskStyles: Record<RiskLevel, string> = {
  High: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  Moderate: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  Low: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

const riskIcons: Record<RiskLevel, typeof ShieldAlert> = {
  High: ShieldAlert,
  Moderate: ShieldQuestion,
  Low: ShieldCheck,
};

const samplePatientRecord = {
  name: "David Ortiz",
  age: 57,
  sex: "Male",
  conditions: ["Prediabetes", "Gingival disease"],
  medications: ["Metformin", "Lisinopril"],
  encounters: ["Outpatient visit", "Dental consultation"],
  vitals: {
    bloodPressure: "138/88",
    bmi: 28.4,
    heartRate: 76,
  },
};

export default function PatientListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [highlightedPatientId, setHighlightedPatientId] = useState("");
  const patientListRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadPatients() {
      const [data, assessmentData] = await Promise.all([getPatients(), getAssessments()]);
      setPatients(data);
      setAssessments(assessmentData);
      setLoading(false);
    }

    void loadPatients();
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setUploadError("");
    setUploadSuccess("");
    setSelectedFile(file);

    if (file && !file.name.toLowerCase().endsWith(".json")) {
      setUploadError("Please select a .json file.");
    }
  }

  async function importPatientRecord(payload: Partial<Patient>, successMessage: string) {
    setUploading(true);

    try {
      const { patient, assessment } = await uploadPatient(payload);
      setPatients((current) => [patient, ...current.filter((item) => item.id !== patient.id)]);
      setAssessments((current) => [
        assessment,
        ...current.filter((item) => item.id !== assessment.id),
      ]);
      setHighlightedPatientId(patient.id);
      setUploadSuccess(successMessage);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      patientListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedPatientId("");
        highlightTimeoutRef.current = null;
      }, 3500);
    } catch {
      setUploadError("Upload failed. Check the backend and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleUpload() {
    setUploadError("");
    setUploadSuccess("");

    if (!selectedFile) {
      setUploadError("Choose a patient JSON file before uploading.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".json")) {
      setUploadError("Please select a .json file.");
      return;
    }

    try {
      const payload = JSON.parse(await selectedFile.text()) as Partial<Patient>;
      await importPatientRecord(payload, `${selectedFile.name} imported successfully.`);
    } catch {
      setUploadError("Upload failed: JSON is not valid.");
    }
  }

  async function handleLoadSamplePatient() {
    setUploadError("");
    setUploadSuccess("");
    await importPatientRecord(samplePatientRecord, "Sample patient imported successfully.");
  }

  if (loading) {
    return <LoadingState label="Preparing patient summaries..." />;
  }

  if (patients.length === 0) {
    return (
      <EmptyState
        title="No patients available"
        description="This demo view is ready for live data, but no patients are available yet."
      />
    );
  }

  return (
    <section className="space-y-7">
      <div className="rounded-lg border border-sky-100 bg-white p-6 shadow-panel sm:p-7">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-700">
          Demo Overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Patient Risk Queue
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Frontend scaffold for the CareLens hackathon demo. This page is wired with mock
          patient data so the experience works without the backend during UI development.
        </p>
      </div>

      <div className="rounded-lg border border-sky-100 bg-white p-6 shadow-panel md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <FileJson className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                FHIR / CCDA synthetic data (Synthea compatible)
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Import Patient Record
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Simulates importing structured patient data from an electronic health record (EHR)
                system.
              </p>
              <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Demo uses synthetic Synthea-generated records. No real patient data should be
                uploaded.
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-start gap-4">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 transition hover:border-brand-300 hover:bg-brand-50/50">
              <span className="min-w-0 truncate">
                {selectedFile
                  ? selectedFile.name
                  : "Select synthetic patient JSON (FHIR or CCDA-derived format)"}
              </span>
              <span className="shrink-0 font-semibold text-brand-700">Browse</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Importing..." : "Import Record"}
            </button>

            <button
              type="button"
              onClick={handleLoadSamplePatient}
              disabled={uploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <FileJson className="h-4 w-4" />
              Load Sample Patient
            </button>
            <p className="text-xs leading-5 text-slate-500">
              Use a built-in synthetic record for a quick demo.
            </p>
          </div>
        </div>

        <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            View Example Record Format
          </summary>
          <p className="mt-2 text-xs text-slate-500">See expected JSON structure</p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-700">
            <code>{JSON.stringify(samplePatientRecord, null, 2)}</code>
          </pre>
        </details>

        {uploadError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {uploadSuccess}
          </div>
        )}
      </div>

      <div ref={patientListRef} className="scroll-mt-6 space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Available Patients
            </h2>
            <p className="mt-1 text-sm text-slate-600">Preloaded synthetic patient records</p>
          </div>
          <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
            {patients.length} records
          </span>
        </div>

        {patients.map((patient) => {
          const assessment = assessments.find((item) => item.patientId === patient.id);
          const riskLevel = assessment?.riskLevel ?? "Low";
          const RiskIcon = riskIcons[riskLevel];

          return (
            <Link
              key={patient.id}
              to={`/patients/${patient.id}`}
              className={`group block rounded-lg border bg-white p-5 shadow-panel transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg ${
                highlightedPatientId === patient.id
                  ? "border-brand-300 ring-4 ring-brand-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">{patient.name}</h2>
                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${riskStyles[riskLevel]}`}
                    >
                      <RiskIcon className="h-3.5 w-3.5" />
                      {riskLevel} Risk
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Age {patient.age} • {patient.sex} • {patient.conditions.join(", ")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 text-sm text-slate-500 sm:items-end">
                  <span>
                    Assessed{" "}
                    {assessment
                      ? new Date(assessment.createdAt).toLocaleDateString()
                      : "pending"}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-brand-700">
                    View dashboard
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
