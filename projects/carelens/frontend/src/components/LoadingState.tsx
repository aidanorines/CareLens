import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({
  label = "Loading patient data...",
}: LoadingStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-sky-100 bg-white p-8 text-center shadow-panel">
      <div className="mb-4 rounded-lg bg-brand-50 p-3 text-brand-700">
        <LoaderCircle className="h-7 w-7 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="mt-1 text-xs text-slate-500">Loading synthetic CareLens demo data</p>
    </div>
  );
}
