import { Badge, type Tone } from "./Badge";

export type ConfidenceLevel = "verified" | "estimated" | "detected" | "unavailable";

const meta: Record<ConfidenceLevel, { label: string; tone: Tone; description: string }> = {
  verified: {
    label: "Verified",
    tone: "good",
    description: "Information directly confirmed through connected/authorized data.",
  },
  estimated: {
    label: "Estimated",
    tone: "gold",
    description: "Information calculated or estimated using third-party data.",
  },
  detected: {
    label: "Detected",
    tone: "info",
    description: "Information detected from the publicly accessible website.",
  },
  unavailable: {
    label: "Unavailable",
    tone: "muted",
    description: "The system could not obtain reliable information.",
  },
};

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
}

/**
 * This is the app's "DataConfidenceBadge" - marks every piece of data
 * with how much it can be trusted. Never omit this on a number or
 * finding that came from anywhere but a hardcoded UI label (see
 * docs/BLUEPRINT.md Section X). The explanation is available on
 * hover/focus (native title) and always to screen readers (visually
 * hidden text), not hover-only.
 */
export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const { label, tone, description } = meta[level];
  return (
    <Badge tone={tone} className="cursor-help" title={description}>
      {label}
      <span className="sr-only"> — {description}</span>
    </Badge>
  );
}

export const confidenceMeta = meta;
