import { Activity, AlertTriangle, ShieldCheck, ShieldQuestion, Users } from "lucide-react";
import PatientCard from "../components/PatientCard";
import EmptyState from "../components/EmptyState";
import { mockAssessments, mockPatients } from "../data/mockPatients";
import type { RiskLevel } from "../types/patient";

const summaryCards = [
  {
    label: "Total Patients",
    value: mockPatients.length,
    icon: Users,
    className: "bg-white text-slate-800",
    iconClassName: "bg-sky-50 text-sky-700",
  },
  {
    label: "High Risk Patients",
    value: countRiskLevel("High"),
    icon: AlertTriangle,
    className: "bg-white text-slate-900",
    iconClassName: "bg-rose-50 text-rose-700",
  },
  {
    label: "Moderate Risk Patients",
    value: countRiskLevel("Moderate"),
    icon: ShieldQuestion,
    className: "bg-white text-slate-900",
    iconClassName: "bg-amber-50 text-amber-700",
  },
  {
    label: "Low Risk Patients",
    value: countRiskLevel("Low"),
    icon: ShieldCheck,
    className: "bg-white text-slate-900",
    iconClassName: "bg-emerald-50 text-emerald-700",
  },
];

function countRiskLevel(riskLevel: RiskLevel) {
  return mockAssessments.filter((assessment) => assessment.riskLevel === riskLevel).length;
}

export default function PatientListPage() {
  if (mockPatients.length === 0) {
    return (
      <EmptyState
        title="No patients available"
        description="This demo view is ready for live data, but no patients are available yet."
      />
    );
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-lg border border-sky-100 bg-white shadow-panel">
        <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-teal-50 px-6 py-7 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                <Activity className="h-4 w-4" />
                CareLens Risk Overview
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-800 md:text-4xl">
                Patient Risk Queue
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Mock clinical profiles are organized by AI risk level so the demo can quickly
                surface who needs attention first.
              </p>
            </div>
            <div className="rounded-lg border border-teal-100 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
              Demo dataset • {mockAssessments.length} assessments
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-slate-50/80 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className={`rounded-lg border border-slate-200 p-4 shadow-sm ${card.className}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm opacity-75">{card.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{card.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${card.iconClassName}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-800">
              Patient Cards
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Review the latest risk level and open the patient dashboard for details.
            </p>
          </div>
        </div>

        <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mockPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              assessment={mockAssessments.find((assessment) => assessment.patientId === patient.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
