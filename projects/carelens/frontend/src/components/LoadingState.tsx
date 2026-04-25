import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({
  label = "Loading patient data...",
}: LoadingStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-panel">
      <LoaderCircle className="mb-4 h-8 w-8 animate-spin text-brand-600" />
      <p className="text-sm font-medium text-slate-700">{label}</p>
    </div>
  );
}
