import { Badge, type Tone } from "./Badge";

export type ConfidenceLevel = "verified" | "estimated" | "detected" | "unavailable";

const meta: Record<ConfidenceLevel, { label: string; tone: Tone; description: string }> = {
  verified: {
    label: "Verified",
    tone: "good",
    description: "We checked this directly, or it's from your connected account.",
  },
  estimated: {
    label: "Estimated",
    tone: "gold",
    description: "A third-party model's best guess — directionally useful, not exact.",
  },
  detected: {
    label: "Detected",
    tone: "info",
    description: "We found a signal automatically — worth a look, not a certainty.",
  },
  unavailable: {
    label: "Unavailable",
    tone: "muted",
    description: "We don't have this data yet.",
  },
};

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
}

/**
 * Marks every piece of data with how much it can be trusted. Never omit
 * this on a number or finding that came from anywhere but a hardcoded
 * UI label - see docs/BLUEPRINT.md Section X.
 */
export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const { label, tone, description } = meta[level];
  return (
    <Badge tone={tone} className="cursor-help" title={description}>
      {label}
    </Badge>
  );
}

export const confidenceMeta = meta;
