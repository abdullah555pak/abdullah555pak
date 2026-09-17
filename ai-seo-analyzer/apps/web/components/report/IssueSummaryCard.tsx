import type { ReportIssue } from "@/lib/report-types";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Button } from "@/components/ui/Button";

interface IssueSummaryCardProps {
  issue: ReportIssue;
  onView?: (issueId: string) => void;
}

/**
 * The compact list-row view of an issue (Task 2) - lighter than the
 * full IssueDetailPanel. Every field this step requires is present:
 * name, short explanation, priority, affected pages, evidence,
 * confidence, fix availability, and a "View issue" action.
 */
export function IssueSummaryCard({ issue, onView }: IssueSummaryCardProps) {
  return (
    <li className="flex flex-col gap-2 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <SeverityBadge severity={issue.severity} />
          <ConfidenceBadge level={issue.confidence} />
          {!issue.fixAvailable && (
            <span className="text-xs font-semibold text-muted">Fix guide not available yet</span>
          )}
        </div>
        <h3 className="mt-1.5 font-semibold text-ink">{issue.title}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">{issue.shortExplanation}</p>
        <p className="mt-1 text-xs text-muted">
          {issue.affectedPages === null
            ? "Affected pages: not available yet"
            : `Affects ${issue.affectedPages} page${issue.affectedPages === 1 ? "" : "s"}`}
        </p>
      </div>
      <Button size="sm" variant="secondary" onClick={() => onView?.(issue.id)} className="shrink-0">
        View issue
      </Button>
    </li>
  );
}
