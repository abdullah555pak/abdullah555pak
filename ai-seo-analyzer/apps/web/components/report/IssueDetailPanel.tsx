"use client";

import { useState } from "react";
import type { ReportIssue } from "@/lib/report-types";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ReportStatusMessage } from "./ReportStatusMessage";

interface IssueDetailPanelProps {
  issue: ReportIssue | null;
  scanHref?: string;
}

const DIFFICULTY_LABEL: Record<NonNullable<ReportIssue["difficulty"]>, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const IMPACT_LABEL: Record<NonNullable<ReportIssue["expectedImpact"]>, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/**
 * Task 6: the full single-issue view - what's wrong, why it matters,
 * evidence, affected pages, how to fix, difficulty, expected impact,
 * and confidence, plus the two follow-on actions. `issue` is null in
 * production today (there is no real issue to open); this renders the
 * honest unavailable state in that case rather than inventing one.
 */
export function IssueDetailPanel({ issue, scanHref }: IssueDetailPanelProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  if (!issue) {
    return <ReportStatusMessage kind="unavailable" scanHref={scanHref} />;
  }

  return (
    <article>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl font-semibold text-ink">{issue.title}</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          <SeverityBadge severity={issue.severity} />
          <ConfidenceBadge level={issue.confidence} />
        </div>
      </div>

      <dl className="mt-4 flex flex-col gap-4 text-sm">
        <div>
          <dt className="font-semibold text-ink">What is wrong?</dt>
          <dd className="mt-0.5 text-ink-soft">{issue.shortExplanation}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Why does it matter?</dt>
          <dd className="mt-0.5 text-ink-soft">{issue.whyItMatters}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Affected pages</dt>
          <dd className="mt-0.5 text-ink-soft">
            {issue.affectedPages === null ? "Not available yet" : issue.affectedPages}
          </dd>
        </div>

        {issue.howToFix && issue.howToFix.length > 0 && (
          <div>
            <dt className="font-semibold text-ink">How to fix it</dt>
            <dd>
              <ol className="mt-1 flex list-decimal flex-col gap-1 pl-5 text-ink-soft">
                {issue.howToFix.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </dd>
          </div>
        )}

        <div className="flex flex-wrap gap-6">
          <div>
            <dt className="font-semibold text-ink">Difficulty</dt>
            <dd className="mt-0.5 text-ink-soft">
              {issue.difficulty ? DIFFICULTY_LABEL[issue.difficulty] : "Not available yet"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Expected impact</dt>
            <dd className="mt-0.5 text-ink-soft">
              {issue.expectedImpact ? IMPACT_LABEL[issue.expectedImpact] : "Not available yet"}
            </dd>
          </div>
        </div>

        {issue.evidence && (
          <div>
            <button
              type="button"
              onClick={() => setEvidenceOpen((v) => !v)}
              aria-expanded={evidenceOpen}
              className="inline-flex items-center gap-1 rounded text-sm font-semibold text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className={`inline-block transition-transform ${evidenceOpen ? "rotate-90" : ""}`}>
                ›
              </span>
              {evidenceOpen ? "Hide technical details" : "Show technical details"}
            </button>
            {evidenceOpen && (
              <code className="mt-2 block whitespace-pre-wrap rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs text-ink-soft">
                {issue.evidence}
              </code>
            )}
          </div>
        )}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button disabled={!issue.fixAvailable}>See complete fix guide</Button>
        {scanHref && (
          <ButtonLink href={scanHref} variant="secondary">
            Re-scan after fixing
          </ButtonLink>
        )}
      </div>
      {!issue.fixAvailable && (
        <p className="mt-2 text-xs text-muted">The full fix guide for this issue isn&apos;t available yet.</p>
      )}
    </article>
  );
}
