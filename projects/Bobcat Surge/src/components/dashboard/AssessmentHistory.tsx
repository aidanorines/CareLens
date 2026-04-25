import type { Assessment } from "../../types/patient";

interface AssessmentHistoryProps {
  assessments: Assessment[];
  className?: string;
}

export default function AssessmentHistory({ assessments, className = "" }: AssessmentHistoryProps) {
  return (
    <article className={`rounded-lg border border-slate-200 bg-white p-6 shadow-panel ${className}`}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-800">
          Assessment History
        </h2>
        <p className="text-sm text-slate-500">Latest risk scoring events</p>
      </div>

      <ul className="mt-5 space-y-3">
        {assessments.length > 0 ? (
          assessments.map((assessment) => (
            <li
              key={assessment.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {new Date(assessment.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  Assessment created
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm font-semibold text-slate-800">
                  {assessment.riskLevel} risk
                </p>
                <p className="mt-1 text-sm text-slate-500">Score {assessment.riskScore}</p>
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No assessments recorded.
          </li>
        )}
      </ul>
    </article>
  );
}
