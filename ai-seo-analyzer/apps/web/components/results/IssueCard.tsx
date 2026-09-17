"use client";

import { useId, useState } from "react";
import { PriorityBadge, type PriorityLevel, priorityMeta } from "@/components/ui/PriorityBadge";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/ui/ConfidenceBadge";

export interface IssueCardProps {
  title: string;
  priority: PriorityLevel;
  confidence: ConfidenceLevel;
  whyItMatters: string;
  evidence?: string;
  fixSteps: string[];
  verifyMethod?: string;
}

/**
 * The one reusable shape every SEO finding renders through, everywhere
 * in the app (overview, issues list, category filters, deep links).
 * Structure only - no real finding is wired in until the SEO engine
 * exists (see docs/BLUEPRINT.md Section F).
 */
export function IssueCard({
  title,
  priority,
  confidence,
  whyItMatters,
  evidence,
  fixSteps,
  verifyMethod,
}: IssueCardProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const evidenceId = useId();

  return (
    <div className="flex gap-3 border-b border-border py-4 last:border-b-0">
      <span
        className={`w-1 shrink-0 self-stretch rounded-full ${priorityMeta[priority].stripeClass}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-ink">{title}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityBadge level={priority} />
            <ConfidenceBadge level={confidence} />
          </div>
        </div>

        <p className="mt-1.5 text-sm text-ink-soft">
          <span className="font-semibold">Why it matters: </span>
          {whyItMatters}
        </p>

        {fixSteps.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-ink">How to fix it</p>
            <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-5 text-sm text-ink-soft">
              {fixSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {verifyMethod && (
          <p className="mt-3 text-sm text-ink-soft">
            <span className="font-semibold text-ink">How to verify it&apos;s fixed: </span>
            {verifyMethod}
          </p>
        )}

        {evidence && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setEvidenceOpen((v) => !v)}
              aria-expanded={evidenceOpen}
              aria-controls={evidenceId}
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong"
            >
              <span
                className={`inline-block transition-transform ${evidenceOpen ? "rotate-90" : ""}`}
                aria-hidden="true"
              >
                ›
              </span>
              {evidenceOpen ? "Hide technical details" : "Show technical details"}
            </button>
            {evidenceOpen && (
              <code
                id={evidenceId}
                className="mt-2 block whitespace-pre-wrap rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs text-ink-soft"
              >
                {evidence}
              </code>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
