import { AlertTriangle } from "lucide-react";

interface RiskBadgeProps {
  flag: string;
}

export default function RiskBadge({ flag }: RiskBadgeProps) {
  return (
    <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-rose-800">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-white p-2 text-rose-700 shadow-sm">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium leading-6">{flag}</p>
      </div>
    </div>
  );
}
