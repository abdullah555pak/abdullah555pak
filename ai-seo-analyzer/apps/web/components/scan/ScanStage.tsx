import type { ScanStageState } from "@/lib/scan-stages";

const ICONS: Record<ScanStageState["status"], "empty" | "spinner" | "check" | "x" | "dash"> = {
  pending: "empty",
  running: "spinner",
  completed: "check",
  failed: "x",
  skipped: "dash",
  not_available: "dash",
};

const STATUS_LABELS: Record<ScanStageState["status"], string> = {
  pending: "Not started yet",
  running: "In progress",
  completed: "Done",
  failed: "Couldn't complete",
  skipped: "Skipped",
  not_available: "Not available",
};

function StageIcon({ status }: { status: ScanStageState["status"] }) {
  const icon = ICONS[status];
  const circleClass =
    status === "completed"
      ? "border-good bg-good"
      : status === "failed"
        ? "border-critical bg-critical"
        : status === "running"
          ? "border-accent"
          : "border-border";

  return (
    <span
      className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${circleClass}`}
      aria-hidden="true"
    >
      {icon === "check" && (
        <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {icon === "x" && (
        <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {icon === "dash" && <span className="h-0.5 w-2.5 rounded-full bg-muted" />}
      {icon === "spinner" && (
        <span className="absolute inset-0.5 animate-ping rounded-full bg-accent opacity-40" />
      )}
    </span>
  );
}

export interface ScanStageRowProps {
  stage: ScanStageState;
  /** Show the plain-language description under the label (default true). */
  showDescription?: boolean;
}

/** One row in the scan-progress stage list. */
export function ScanStageRow({ stage, showDescription = true }: ScanStageRowProps) {
  const dim = stage.status === "pending" || stage.status === "not_available" || stage.status === "skipped";
  return (
    <li className="flex items-start gap-3 rounded-xl px-3 py-2.5">
      <StageIcon status={stage.status} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${dim ? "text-muted" : "text-ink"}`}>
          {stage.label}
          <span className="sr-only"> — {STATUS_LABELS[stage.status]}</span>
        </p>
        {showDescription && <p className="text-xs text-muted">{stage.description}</p>}
      </div>
    </li>
  );
}
