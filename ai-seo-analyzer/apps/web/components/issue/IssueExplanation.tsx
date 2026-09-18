import type { ReportIssue } from "@/lib/report-types";

interface IssueExplanationProps {
  issue: ReportIssue;
}

/** Task 2: "What is the problem?" - the plain-language answer, on its own. */
export function IssueExplanation({ issue }: IssueExplanationProps) {
  return (
    <section aria-labelledby="issue-what-heading">
      <h2 id="issue-what-heading" className="text-lg font-semibold text-ink">
        What is the problem?
      </h2>
      <p className="mt-1.5 text-sm text-ink-soft">{issue.shortExplanation}</p>
    </section>
  );
}
