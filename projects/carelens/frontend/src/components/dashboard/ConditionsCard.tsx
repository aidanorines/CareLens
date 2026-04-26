import { ClipboardList } from "lucide-react";

interface ConditionsCardProps {
  conditions: string[];
}

export default function ConditionsCard({ conditions }: ConditionsCardProps) {
  return (
    <article className="rounded-lg border border-sky-100 bg-white p-5 shadow-panel sm:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-sky-50 p-3 text-sky-700">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-800">Conditions</h2>
          <p className="text-sm text-slate-500">Active clinical concerns</p>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2">
        {conditions.length > 0 ? (
          conditions.map((condition) => (
            <li
              key={condition}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              {condition}
            </li>
          ))
        ) : (
          <li className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
            No active conditions are available.
          </li>
        )}
      </ul>
    </article>
  );
}
