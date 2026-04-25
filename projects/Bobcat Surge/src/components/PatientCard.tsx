import {
  ArrowRight,
  ClipboardList,
  HeartPulse,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Assessment, Patient, RiskLevel } from "../types/patient";

const riskStyles: Record<RiskLevel, string> = {
  High: "border-rose-200 bg-rose-50 text-rose-700",
  Moderate: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const riskIcons: Record<RiskLevel, typeof ShieldAlert> = {
  High: ShieldAlert,
  Moderate: ShieldQuestion,
  Low: ShieldCheck,
};

interface PatientCardProps {
  patient: Patient;
  assessment?: Assessment;
}

export default function PatientCard({ patient, assessment }: PatientCardProps) {
  const riskLevel = assessment?.riskLevel ?? "Low";
  const RiskIcon = riskIcons[riskLevel];
  const mainConditions = patient.conditions.slice(0, 3);

  return (
    <article className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-panel transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg">
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-800">{patient.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Age {patient.age} • {patient.sex}
            </p>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${riskStyles[riskLevel]}`}
          >
            <RiskIcon className="h-3.5 w-3.5" />
            {riskLevel}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            <ClipboardList className="h-4 w-4" />
            Conditions
          </div>
          <div className="flex min-h-20 flex-wrap content-start gap-2">
            {mainConditions.map((condition) => (
              <span
                key={condition}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs leading-5 text-slate-600"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <HeartPulse className="h-4 w-4 text-brand-700" />
          <span>Latest score: {assessment?.riskScore ?? "Pending"}</span>
        </div>

        <Link
          to={`/patients/${patient.id}`}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          View Dashboard
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
