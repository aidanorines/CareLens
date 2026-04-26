import { FileText } from "lucide-react";

interface SummaryCardProps {
  summary?: string;
  className?: string;
}

export default function SummaryCard({ summary, className = "" }: SummaryCardProps) {
  return (
    <article className={`rounded-lg border border-sky-100 bg-white p-6 shadow-panel ${className}`}>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-brand-50 p-3 text-brand-700">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-800">AI Summary</h2>
          <p className="text-sm text-slate-500">Readable clinical risk summary</p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-700">
        {summary ?? "No AI summary is available for this patient yet."}
      </p>
    </article>
  );
}
