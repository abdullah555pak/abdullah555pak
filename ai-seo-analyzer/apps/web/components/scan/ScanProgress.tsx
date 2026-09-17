export interface ScanStage {
  id: string;
  label: string;
}

export const DEFAULT_SCAN_STAGES: ScanStage[] = [
  { id: "checking-website", label: "Checking website" },
  { id: "finding-pages", label: "Finding pages" },
  { id: "checking-technical-seo", label: "Checking technical SEO" },
  { id: "checking-performance", label: "Checking performance" },
  { id: "analyzing-content", label: "Analyzing content" },
  { id: "preparing-report", label: "Preparing report" },
];

export interface ScanProgressProps {
  stages?: ScanStage[];
  /** -1 = not started yet, stages.length = every stage done */
  currentIndex: number;
  targetLabel?: string;
}

/**
 * Visual structure for a future scan-progress screen. Purely
 * presentational - it shows whatever `currentIndex` it's given and makes
 * no claim about real work happening unless a caller wires it to one
 * (nothing in the app does yet; see app/preview for a labeled demo).
 */
export function ScanProgress({
  stages = DEFAULT_SCAN_STAGES,
  currentIndex,
  targetLabel,
}: ScanProgressProps) {
  const doneCount = Math.max(0, Math.min(currentIndex, stages.length));
  const percent = Math.round((doneCount / stages.length) * 100);

  return (
    <div className="mx-auto max-w-md text-center">
      <h2 className="font-display text-xl font-semibold text-ink">Analyzing your website</h2>
      {targetLabel && (
        <p className="mt-1 text-sm text-muted">
          Scanning <span className="font-semibold text-ink">{targetLabel}</span>
        </p>
      )}

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="mt-5 flex flex-col gap-1 rounded-2xl border border-border bg-surface p-2 text-left shadow-sm">
        {stages.map((stage, index) => {
          const state = index < currentIndex ? "done" : index === currentIndex ? "active" : "pending";
          return (
            <li key={stage.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  state === "pending"
                    ? "border-border"
                    : state === "active"
                      ? "border-accent"
                      : "border-accent bg-accent"
                }`}
                aria-hidden="true"
              >
                {state === "done" && (
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span
                className={`text-sm font-medium ${state === "pending" ? "text-muted" : "text-ink"}`}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="sr-only" role="status">
        {currentIndex >= stages.length
          ? "Scan complete."
          : currentIndex < 0
            ? "Scan not started."
            : `Step ${currentIndex + 1} of ${stages.length}: ${stages[currentIndex]?.label}, in progress.`}
      </p>
    </div>
  );
}
