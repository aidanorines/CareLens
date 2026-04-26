import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-sky-200 bg-white p-8 text-center shadow-panel sm:p-10">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
        <Inbox className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
