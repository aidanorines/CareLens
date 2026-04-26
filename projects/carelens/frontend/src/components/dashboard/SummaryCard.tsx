import { FileText, Info } from "lucide-react";

interface SummaryCardProps {
  summary?: string;
  className?: string;
}

interface ParsedSummary {
  summary?: string;
  keyFindings: string[];
  openQuestions: string[];
  raw?: string;
}

const SECTION_HEADERS = ["Summary", "Key Findings", "Open Questions"] as const;

function parseSummary(raw: string): ParsedSummary {
  const sections: Record<string, string[]> = {};
  let current: string | null = null;

  raw.split(/\r?\n/).forEach((line) => {
    const header = SECTION_HEADERS.find((name) =>
      line.trim().toLowerCase().startsWith(`${name.toLowerCase()}:`),
    );

    if (header) {
      current = header;
      const inline = line.split(":").slice(1).join(":").trim();
      sections[current] = inline ? [inline] : [];
      return;
    }

    if (!current) return;
    const trimmed = line.trim();
    if (!trimmed) return;

    sections[current].push(trimmed);
  });

  const summaryLines = sections["Summary"] ?? [];
  const findingLines = sections["Key Findings"] ?? [];
  const questionLines = sections["Open Questions"] ?? [];

  const toBullets = (lines: string[]): string[] =>
    lines
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);

  return {
    summary: summaryLines.join(" ").trim() || undefined,
    keyFindings: toBullets(findingLines),
    openQuestions: toBullets(questionLines),
    raw,
  };
}

export default function SummaryCard({ summary, className = "" }: SummaryCardProps) {
  const parsed = summary ? parseSummary(summary) : undefined;
  const hasStructured =
    parsed && (parsed.summary || parsed.keyFindings.length || parsed.openQuestions.length);

  return (
    <article
      className={`rounded-lg border border-sky-100 bg-white p-6 shadow-panel ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-brand-50 p-3 text-brand-700">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-800">
            AI Summary
          </h2>
          <p className="text-sm text-slate-500">Readable clinical risk summary</p>
        </div>
      </div>

      {!summary ? (
        <p className="mt-5 text-sm leading-7 text-slate-600">
          No AI summary is available for this patient yet.
        </p>
      ) : hasStructured ? (
        <div className="mt-5 space-y-5 text-sm leading-6 text-slate-700">
          {parsed?.summary && (
            <p className="text-slate-800">{parsed.summary}</p>
          )}

          {parsed && parsed.keyFindings.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Key Findings
              </h3>
              <ul className="mt-2 space-y-1.5">
                {parsed.keyFindings.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed && parsed.openQuestions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Open Questions
              </h3>
              <ul className="mt-2 space-y-1.5">
                {parsed.openQuestions.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">
          {summary}
        </p>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs leading-5 text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>
          Generated from synthetic data. Informational only — not a diagnosis or
          treatment recommendation.
        </span>
      </div>
    </article>
  );
}
