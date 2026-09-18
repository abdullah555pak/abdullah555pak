import type { IssueEvidence } from "@/lib/report-types";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { EmptyState } from "@/components/ui/EmptyState";

interface EvidencePanelProps {
  evidence: IssueEvidence[] | null;
}

const FIELD_LABELS: { key: keyof IssueEvidence; label: string }[] = [
  { key: "url", label: "Page" },
  { key: "htmlElement", label: "HTML element" },
  { key: "detectedValue", label: "What we detected" },
  { key: "expectedValue", label: "What was expected" },
];

/**
 * Task 4: the structured, per-item proof behind a finding - never a
 * single opaque string. Each item carries its own confidence, since
 * one finding can mix directly-observed and estimated evidence.
 */
export function EvidencePanel({ evidence }: EvidencePanelProps) {
  if (!evidence || evidence.length === 0) {
    return (
      <EmptyState
        title="Evidence unavailable"
        description="We don't have specific evidence recorded for this issue yet."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {evidence.map((item, index) => {
        const fields = FIELD_LABELS.filter(({ key }) => item[key]);
        return (
          <Card key={index} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted">Evidence {index + 1}</p>
              <ConfidenceBadge level={item.confidence} />
            </div>

            {fields.length > 0 && (
              <dl className="flex flex-col gap-1.5 text-sm">
                {fields.map(({ key, label }) => (
                  <div key={key}>
                    <dt className="inline font-semibold text-ink">{label}: </dt>
                    <dd className="inline break-words text-ink-soft">{item[key]}</dd>
                  </div>
                ))}
              </dl>
            )}

            {item.technicalDetails && (
              <code className="mt-1 block whitespace-pre-wrap rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs text-ink-soft">
                {item.technicalDetails}
              </code>
            )}

            {item.screenshotUrl ? (
              <img
                src={item.screenshotUrl}
                alt={`Screenshot showing this issue on ${item.url ?? "the affected page"}`}
                className="mt-1 rounded-lg border border-border"
              />
            ) : (
              <p className="text-xs text-muted">Screenshot not available yet.</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
