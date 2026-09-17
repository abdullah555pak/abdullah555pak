import { Badge, type Tone } from "./Badge";
import type { IssueSeverity } from "@/lib/report-types";

const meta: Record<IssueSeverity, { label: string; tone: Tone }> = {
  critical: { label: "Critical", tone: "critical" },
  high: { label: "High", tone: "warn" },
  medium: { label: "Medium", tone: "gold" },
  low: { label: "Low", tone: "info" },
  passed: { label: "Passed", tone: "good" },
  informational: { label: "Informational", tone: "muted" },
};

export const SEVERITY_ORDER: IssueSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "passed",
  "informational",
];

interface SeverityBadgeProps {
  severity: IssueSeverity;
}

/**
 * The report's issue-severity system (distinct from the homepage action
 * plan's simpler 4-level PriorityBadge). Always paired with its text
 * label - color is never the only signal, per the accessibility
 * requirement that Critical/High/Medium/Low have text labels too.
 */
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { label, tone } = meta[severity];
  return <Badge tone={tone}>{label}</Badge>;
}

export const severityMeta = meta;
