import type { VerificationStatus } from "@/lib/report-types";
import { Badge, type Tone } from "@/components/ui/Badge";

const meta: Record<VerificationStatus, { label: string; tone: Tone; description: string }> = {
  not_verified: {
    label: "Not verified yet",
    tone: "muted",
    description: "Re-scan after making your fix to check whether it worked.",
  },
  fixed: {
    label: "Fixed",
    tone: "good",
    description: "The last re-scan found this issue no longer present.",
  },
  improved: {
    label: "Improved",
    tone: "good",
    description: "The last re-scan found this got better, but hasn't fully resolved it.",
  },
  still_needs_attention: {
    label: "Still needs attention",
    tone: "warn",
    description: "The last re-scan found this issue is still present.",
  },
  unable_to_verify: {
    label: "Unable to verify",
    tone: "gold",
    description: "The last re-scan couldn't check this specific issue.",
  },
  partially_fixed: {
    label: "Partially fixed",
    tone: "gold",
    description: "The last re-scan found this fixed on some pages, but not all.",
  },
};

interface VerificationStateProps {
  status: VerificationStatus;
  lastCheckedAt?: string | null;
}

/**
 * Task 9: the result of checking whether a fix worked. Never shown as
 * anything but "not_verified" until a real re-scan can actually check a
 * specific fix - the other states exist so the UI is ready, and are
 * demonstrated only on /preview today.
 */
export function VerificationState({ status, lastCheckedAt }: VerificationStateProps) {
  const { label, tone, description } = meta[status];
  return (
    <div>
      <Badge tone={tone}>{label}</Badge>
      <p className="mt-1.5 text-sm text-ink-soft">{description}</p>
      {lastCheckedAt && <p className="mt-0.5 text-xs text-muted">Last checked {lastCheckedAt}.</p>}
    </div>
  );
}
