import type { ReportIssue } from "@/lib/report-types";
import { Card } from "@/components/ui/Card";
import { IssueSummaryCard } from "./IssueSummaryCard";
import { ReportStatusMessage } from "./ReportStatusMessage";

interface IssueListProps {
  /** Already filtered/sorted (see hooks/useIssueFilters). */
  issues: ReportIssue[];
  /** The real, unfiltered total - distinguishes "nothing exists yet" from "no matches". */
  totalCount: number;
  onView?: (issueId: string) => void;
}

/**
 * Shows exactly one of three honest states: real issues, "no matches
 * for your filters" (only when real issues exist elsewhere), or "real
 * scan data is not available yet" (today, always, since totalCount is
 * always 0) - never "no issues found" for the last case.
 */
export function IssueList({ issues, totalCount, onView }: IssueListProps) {
  if (totalCount === 0) {
    return (
      <Card>
        <ReportStatusMessage kind="unavailable" />
      </Card>
    );
  }

  if (issues.length === 0) {
    return (
      <Card>
        <ReportStatusMessage kind="no_matches" />
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <ul className="flex flex-col px-5">
        {issues.map((issue) => (
          <IssueSummaryCard key={issue.id} issue={issue} onView={onView} />
        ))}
      </ul>
    </Card>
  );
}
