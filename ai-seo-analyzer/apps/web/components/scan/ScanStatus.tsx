import type { ScanPhase } from "@/lib/scan-machine";

const STATUS_META: Record<ScanPhase, { label: string; className: string }> = {
  idle: { label: "Idle", className: "text-muted" },
  validating: { label: "Checking your input…", className: "text-muted" },
  starting: { label: "Starting your scan…", className: "text-info" },
  scanning: { label: "Scanning…", className: "text-info" },
  cancelling: { label: "Cancelling…", className: "text-warn" },
  completed: { label: "Analysis complete", className: "text-good" },
  partial: { label: "Analysis completed with limitations", className: "text-warn" },
  failed: { label: "Analysis failed", className: "text-critical" },
  unavailable: { label: "Analysis isn't available yet", className: "text-gold" },
};

export interface ScanStatusProps {
  phase: ScanPhase;
  /** Extra context, e.g. the current stage's label. */
  detail?: string;
}

/**
 * The single accessible status line for the whole scan experience.
 * role="status" makes phase changes announced to screen readers without
 * any extra wiring at call sites.
 */
export function ScanStatus({ phase, detail }: ScanStatusProps) {
  const { label, className } = STATUS_META[phase];
  return (
    <p role="status" className={`text-sm font-semibold ${className}`}>
      {label}
      {detail && <span className="ml-1 font-normal text-ink-soft">— {detail}</span>}
    </p>
  );
}
