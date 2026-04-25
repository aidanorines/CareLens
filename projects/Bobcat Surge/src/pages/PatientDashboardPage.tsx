import { ArrowLeft, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AssessmentHistory from "../components/dashboard/AssessmentHistory";
import ConditionsCard from "../components/dashboard/ConditionsCard";
import MedicationsCard from "../components/dashboard/MedicationsCard";
import RiskBadge from "../components/dashboard/RiskBadge";
import SummaryCard from "../components/dashboard/SummaryCard";
import VitalsCard from "../components/dashboard/VitalsCard";
import EmptyState from "../components/EmptyState";
import { mockAssessments, mockPatients } from "../data/mockPatients";
import type { RiskLevel } from "../types/patient";

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

export default function PatientDashboardPage() {
  const { id = "" } = useParams();
  const patient = mockPatients.find((currentPatient) => currentPatient.id === id);
  const patientAssessments = mockAssessments
    .filter((assessment) => assessment.patientId === id)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  const assessment = patientAssessments[0];

  if (!patient) {
    return (
      <EmptyState
        title="Patient not found"
        description="The selected patient record is not available in the current demo dataset."
        action={
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to patient list
          </Link>
        }
      />
    );
  }

  const riskLevel = assessment?.riskLevel;
  const RiskIcon = riskLevel ? riskIcons[riskLevel] : ShieldQuestion;

  return (
    <section className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patient list
      </Link>

      <article className="overflow-hidden rounded-lg border border-sky-100 bg-white shadow-panel">
        <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-teal-50 px-6 py-7 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Patient Overview
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-800 md:text-4xl">
                {patient.name}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Age {patient.age} · {patient.sex}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className={`rounded-lg border px-4 py-3 ${
                  riskLevel ? riskStyles[riskLevel] : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <RiskIcon className="h-4 w-4" />
                  {riskLevel ?? "Pending"} Risk
                </div>
                <p className="mt-1 text-xs opacity-80">Current risk level</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700">
                <p className="text-sm font-semibold">Risk Score</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {assessment?.riskScore ?? "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      <VitalsCard vitals={patient.vitals} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ConditionsCard conditions={patient.conditions} />
        <MedicationsCard medications={patient.medications} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-800">Risk Flags</h2>
            <p className="text-sm text-slate-500">Factors contributing to the latest score</p>
          </div>
          <div className="mt-5 flex flex-1 flex-col gap-3">
            {assessment?.flags.length ? (
              assessment.flags.map((flag) => <RiskBadge key={flag} flag={flag} />)
            ) : (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No risk flags are available.
              </div>
            )}
          </div>
        </article>

        <div className="flex h-full flex-col gap-6">
          <SummaryCard summary={assessment?.summary} className="lg:flex-1" />
          <AssessmentHistory assessments={patientAssessments} />
        </div>
      </div>
    </section>
  );
}
