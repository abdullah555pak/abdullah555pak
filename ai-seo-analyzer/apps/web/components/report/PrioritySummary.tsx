import type { ReportIssue } from "@/lib/report-types";
import { Card } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Button } from "@/components/ui/Button";
import { ReportStatusMessage } from "./ReportStatusMessage";

interface PrioritySummaryProps {
  /** The most important items to fix, already ranked - empty until real analysis exists. */
  topIssues: ReportIssue[];
  onSeeHowToFix?: (issueId: string) => void;
}

/**
 * Task 1C: "What should I fix first?" Each future item shows problem,
 * why it matters, priority, evidence, and a fix action - today this
 * is always the empty case, since nothing has been analyzed.
 */
export function PrioritySummary({ topIssues, onSeeHowToFix }: PrioritySummaryProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">What should I fix first?</h2>

      {topIssues.length === 0 ? (
        <div className="mt-3">
          <ReportStatusMessage kind="unavailable" />
        </div>
      ) : (
        <ol className="mt-3 flex flex-col gap-3">
          {topIssues.map((issue) => (
            <li key={issue.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-ink">{issue.title}</h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <SeverityBadge severity={issue.severity} />
                  <ConfidenceBadge level={issue.confidence} />
                </div>
              </div>
              <p className="mt-1.5 text-sm text-ink-soft">
                <span className="font-semibold">Why it matters: </span>
                {issue.whyItMatters}
              </p>
              {issue.evidence && (
                <p className="mt-1 font-mono text-xs text-muted">{issue.evidence}</p>
              )}
              <div className="mt-3">
                <Button size="sm" onClick={() => onSeeHowToFix?.(issue.id)}>
                  See how to fix
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
