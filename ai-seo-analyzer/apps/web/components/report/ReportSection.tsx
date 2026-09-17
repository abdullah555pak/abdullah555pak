import type { ReactNode } from "react";
import type { DataConfidence } from "@/lib/report-types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

interface ReportSectionProps {
  title: string;
  description: string;
  confidence?: DataConfidence;
  action?: ReactNode;
  children: ReactNode;
}

/**
 * The consistent shell for every report page/category section: a
 * heading, a one-line beginner explanation, an optional section-level
 * confidence badge, and a slot for a "View details" action.
 */
export function ReportSection({ title, description, confidence, action, children }: ReportSectionProps) {
  return (
    <section aria-labelledby={`${title}-heading`.replace(/\s+/g, "-").toLowerCase()}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2
            id={`${title}-heading`.replace(/\s+/g, "-").toLowerCase()}
            className="text-xl font-semibold text-ink"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {confidence && <ConfidenceBadge level={confidence} />}
          {action}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
