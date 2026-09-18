import type { ReportIssue } from "@/lib/report-types";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

interface IssueDetailHeaderProps {
  issue: ReportIssue;
}

/**
 * The top of the Issue Detail page (Task 1): title, priority, data
 * confidence, a one-line explanation, and how many pages are affected.
 * Priority reuses SeverityBadge and data confidence reuses
 * ConfidenceBadge rather than introducing near-duplicate components.
 */
export function IssueDetailHeader({ issue }: IssueDetailHeaderProps) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-1.5">
        <SeverityBadge severity={issue.severity} />
        <ConfidenceBadge level={issue.confidence} />
      </div>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{issue.title}</h1>
      <p className="mt-1 text-ink-soft">{issue.shortExplanation}</p>
      <p className="mt-2 text-xs text-muted">
        {issue.affectedPages === null
          ? "Affected pages: not available yet"
          : `Affects ${issue.affectedPages} page${issue.affectedPages === 1 ? "" : "s"}`}
        {issue.source && <> · Source: {issue.source}</>}
      </p>
    </header>
  );
}
