import { Pill } from "lucide-react";

interface MedicationsCardProps {
  medications: string[];
}

export default function MedicationsCard({ medications }: MedicationsCardProps) {
  return (
    <article className="rounded-lg border border-sky-100 bg-white p-5 shadow-panel sm:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-teal-50 p-3 text-teal-700">
          <Pill className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-800">Medications</h2>
          <p className="text-sm text-slate-500">Current medication list</p>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {medications.map((medication) => (
          <li
            key={medication}
            className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700"
          >
            {medication}
          </li>
        ))}
      </ul>
    </article>
  );
}
