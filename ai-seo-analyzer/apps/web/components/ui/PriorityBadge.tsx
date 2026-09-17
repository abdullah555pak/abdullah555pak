import { Badge, type Tone } from "./Badge";

export type PriorityLevel = "critical" | "important" | "improvement" | "good";

const meta: Record<PriorityLevel, { label: string; tone: Tone; stripeClass: string }> = {
  critical: { label: "Needs immediate attention", tone: "critical", stripeClass: "bg-critical" },
  important: { label: "Important", tone: "warn", stripeClass: "bg-warn" },
  improvement: { label: "Improvement", tone: "info", stripeClass: "bg-info" },
  good: { label: "Good", tone: "good", stripeClass: "bg-good" },
};

interface PriorityBadgeProps {
  level: PriorityLevel;
}

/**
 * The app's one priority system - never invent a second one. This is a
 * measure of "how much our automated checks say this matters," not a
 * Google ranking signal.
 */
export function PriorityBadge({ level }: PriorityBadgeProps) {
  const { label, tone } = meta[level];
  return <Badge tone={tone}>{label}</Badge>;
}

export const priorityMeta = meta;
