import { Activity, HeartPulse, Scale, Thermometer, Wind } from "lucide-react";
import type { Patient } from "../../types/patient";

interface VitalsCardProps {
  vitals: Patient["vitals"];
}

const vitalsMeta = [
  {
    label: "Blood Pressure",
    key: "bloodPressure",
    unit: "mmHg",
    icon: Activity,
  },
  {
    label: "Heart Rate",
    key: "heartRate",
    unit: "bpm",
    icon: HeartPulse,
  },
  {
    label: "BMI",
    key: "bmi",
    unit: "",
    icon: Scale,
  },
  {
    label: "Temperature",
    key: "temperature",
    unit: "F",
    icon: Thermometer,
  },
  {
    label: "Oxygen Saturation",
    key: "oxygenSaturation",
    unit: "%",
    icon: Wind,
  },
] as const;

export default function VitalsCard({ vitals }: VitalsCardProps) {
  return (
    <article className="rounded-lg border border-sky-100 bg-white p-5 shadow-panel sm:p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Vitals</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Current Measurements
        </h2>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {vitalsMeta.map(({ label, key, unit, icon: Icon }) => {
          const value = vitals[key];

          return (
            <div key={key} className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Icon className="h-4 w-4 text-brand-700" />
                {label}
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                {value ?? "N/A"}
                {value !== undefined && unit ? (
                  <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>
                ) : null}
              </p>
            </div>
          );
        })}
      </div>
    </article>
  );
}
