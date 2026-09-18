import { Badge } from "@/components/ui/Badge";
import type { ReportIssue } from "@/lib/report-types";

type Difficulty = NonNullable<ReportIssue["difficulty"]>;

const meta: Record<Difficulty, { label: string; tone: "good" | "gold" | "critical" }> = {
  easy: { label: "Easy", tone: "good" },
  moderate: { label: "Moderate", tone: "gold" },
  advanced: { label: "Advanced", tone: "critical" },
};

interface DifficultyBadgeProps {
  difficulty: ReportIssue["difficulty"];
}

/** How hard a fix is to carry out, in plain beginner terms. */
export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  if (!difficulty) return <Badge tone="muted">Not available yet</Badge>;
  const { label, tone } = meta[difficulty];
  return <Badge tone={tone}>{label}</Badge>;
}
