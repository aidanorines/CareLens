import { Activity, HeartPulse, Scale, Thermometer, Wind } from "lucide-react";
import type { Patient } from "../../types/patient";

interface VitalsCardProps {
  vitals: Patient["vitals"];
}

const vitalsMeta = [
  {
    label: "Blood Pressure",
    key: "bloodPressure",
    icon: Activity,
  },
  {
    label: "Heart Rate",
    key: "heartRate",
    icon: HeartPulse,
  },
  {
    label: "BMI",
    key: "bmi",
    icon: Scale,
  },
  {
    label: "Temperature",
    key: "temperature",
    icon: Thermometer,
  },
  {
    label: "Oxygen Saturation",
    key: "oxygenSaturation",
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
        {vitalsMeta.map(({ label, key, icon: Icon }) => {
          const formattedValue = formatVitalValue(key, vitals?.[key]);

          return (
            <div key={key} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Icon className="h-4 w-4 shrink-0 text-brand-700" />
                <span className="truncate">{label}</span>
              </div>
              <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-900">
                {formattedValue}
              </p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function formatVitalValue(key: keyof Patient["vitals"], value: Patient["vitals"][keyof Patient["vitals"]]) {
  if (value === undefined || value === null || value === "") return "N/A";

  if (key === "bloodPressure") return String(value);

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "N/A";

  if (key === "heartRate") return `${Math.round(numericValue)} bpm`;
  if (key === "bmi") return numericValue.toFixed(1);
  if (key === "temperature") return `${numericValue.toFixed(1)} °C`;
  if (key === "oxygenSaturation") return `${Math.round(numericValue)}%`;

  return String(value);
}
