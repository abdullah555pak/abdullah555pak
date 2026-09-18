import { Badge } from "@/components/ui/Badge";
import type { ReportIssue } from "@/lib/report-types";

type Impact = NonNullable<ReportIssue["expectedImpact"]>;

const meta: Record<Impact, { label: string; tone: "critical" | "gold" | "info" }> = {
  high: { label: "High", tone: "critical" },
  medium: { label: "Medium", tone: "gold" },
  low: { label: "Low", tone: "info" },
};

interface ImpactBadgeProps {
  impact: ReportIssue["expectedImpact"];
}

/** How much fixing this issue is expected to help. */
export function ImpactBadge({ impact }: ImpactBadgeProps) {
  if (!impact) return <Badge tone="muted">Not available yet</Badge>;
  const { label, tone } = meta[impact];
  return <Badge tone={tone}>{label}</Badge>;
}
