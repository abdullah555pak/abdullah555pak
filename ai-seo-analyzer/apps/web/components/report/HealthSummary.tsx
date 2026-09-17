import type { HealthSummary as HealthSummaryData } from "@/lib/report-types";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

interface HealthSummaryProps {
  data: HealthSummaryData;
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-3 py-3">
      <span className="font-mono text-xl font-bold text-ink">{value ?? "—"}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

/**
 * Task 1B. The score is never a decorative or random number - it's
 * either a real result or an explicit "—" with a sentence saying so.
 * No scoring methodology is invented here; that's defined later
 * alongside the real analyzers.
 */
export function HealthSummary({ data }: HealthSummaryProps) {
  const hasData = data.overallScore !== null;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">Overall SEO health</h2>
        <ConfidenceBadge level={data.confidence} />
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        <div className="flex flex-col items-center">
          <span className="font-mono text-4xl font-bold text-muted" aria-hidden="true">
            {hasData ? data.overallScore : "—"}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {hasData ? "out of 100" : "Score will appear after analysis"}
          </span>
        </div>

        <div className="grid flex-1 grid-cols-3 gap-2">
          <Stat label="Critical issues" value={data.criticalCount} />
          <Stat label="Important issues" value={data.importantCount} />
          <Stat label="Improvements" value={data.improvementCount} />
        </div>
      </div>

      {!hasData && (
        <p className="mt-4 text-sm text-muted">
          Analysis data will appear here after a real scan. This score will never be a guess or a
          placeholder number — it's calculated only from checks that have actually run.
        </p>
      )}
    </Card>
  );
}
