import { useEffect, useState } from "react";
import { AlertTriangle, FileText, Stethoscope } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getPatientById } from "../api/patients";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import type { Patient } from "../types/patient";

export default function PatientDashboardPage() {
  const { id = "" } = useParams();
  const [patient, setPatient] = useState<Patient | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatient() {
      const data = await getPatientById(id);
      setPatient(data);
      setLoading(false);
    }

    void loadPatient();
  }, [id]);

  if (loading) {
    return <LoadingState label="Opening patient dashboard..." />;
  }

  if (!patient) {
    return (
      <EmptyState
        title="Patient not found"
        description="The selected patient record is not available in the current demo dataset."
        action={
          <Link
            to="/"
            className="inline-flex rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Back to patient list
          </Link>
        }
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-panel">
        <Link to="/" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          ← Back to patient list
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Patient Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {patient.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Age {patient.age} • Risk level: {patient.riskLevel}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Last updated {new Date(patient.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">AI Summary Placeholder</h2>
              <p className="text-sm text-slate-500">Frontend-ready summary card for backend data</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {patient.conditionSummary} This panel is reserved for a generated clinical summary,
            timeline highlights, and notable changes once the Node.js + Express API is connected.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Risk Flags</h2>
              <p className="text-sm text-slate-500">Placeholder clinical risk indicators</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="rounded-2xl bg-slate-50 px-4 py-3">Potential readmission risk</li>
            <li className="rounded-2xl bg-slate-50 px-4 py-3">Medication follow-up needed</li>
            <li className="rounded-2xl bg-slate-50 px-4 py-3">Care plan review pending</li>
          </ul>
        </article>
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Next UI Sections</h2>
            <p className="text-sm text-slate-500">Reserved space for iterative frontend buildout</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Vitals trend cards</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Medication adherence panel</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Care team notes and actions</div>
        </div>
      </article>
    </section>
  );
}
