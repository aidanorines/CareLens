import { useEffect, useState } from "react";
import { ArrowRight, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Link } from "react-router-dom";
import { getPatients } from "../api/patients";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import type { Patient, RiskLevel } from "../types/patient";

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

export default function PatientListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      const data = await getPatients();
      setPatients(data);
      setLoading(false);
    }

    void loadPatients();
  }, []);

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
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-panel">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-700">
          Demo Overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Patient Risk Queue
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Frontend scaffold for the CareLens hackathon demo. This page is wired with mock
          patient data so the experience works without the backend during UI development.
        </p>
      </div>

      <div className="grid gap-4">
        {patients.map((patient) => {
          const RiskIcon = riskIcons[patient.riskLevel];

          return (
            <Link
              key={patient.id}
              to={`/patients/${patient.id}`}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-panel transition hover:-translate-y-0.5 hover:border-brand-200"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">{patient.name}</h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${riskStyles[patient.riskLevel]}`}
                    >
                      <RiskIcon className="h-3.5 w-3.5" />
                      {patient.riskLevel} Risk
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Age {patient.age} • {patient.conditionSummary}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>
                    Updated {new Date(patient.lastUpdated).toLocaleDateString()}
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
