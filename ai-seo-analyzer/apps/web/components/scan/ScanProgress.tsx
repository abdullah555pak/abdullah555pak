import type { ScanStageState } from "@/lib/scan-stages";
import { ScanStageRow } from "./ScanStage";

export interface ScanProgressProps {
  stages: ScanStageState[];
}

function summarize(stages: ScanStageState[]) {
  const completed = stages.filter((s) => s.status === "completed").length;
  const failed = stages.filter((s) => s.status === "failed").length;
  const running = stages.find((s) => s.status === "running");
  const trackable = stages.filter((s) => s.status !== "not_available").length;
  const finished = stages.filter(
    (s) => s.status === "completed" || s.status === "failed" || s.status === "skipped"
  ).length;
  // Only ever a real fraction of stages that have actually finished -
  // never a fabricated percentage. Before anything has finished there's
  // nothing real to report yet, so stay indeterminate rather than show
  // a static, seemingly-stuck 0%.
  const percent = trackable > 0 && finished > 0 ? Math.round((finished / trackable) * 100) : null;
  return { completed, failed, running, percent, finished, trackable };
}

/**
 * Renders whatever stage states it's given. It never decides on its own
 * that a stage is running - the caller (today: only app/preview, since
 * no real backend drives this yet) is responsible for that being true.
 */
export function ScanProgress({ stages }: ScanProgressProps) {
  const { running, percent, finished, trackable } = summarize(stages);

  return (
    <div>
      {percent === null ? (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-label="Scan progress"
        >
          <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
        </div>
      ) : (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Scan progress"
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      <ol className="mt-4 flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface p-2 text-left shadow-sm">
        {stages.map((stage) => (
          <ScanStageRow key={stage.id} stage={stage} />
        ))}
      </ol>

      <p className="sr-only" role="status">
        {running
          ? `${running.label}, in progress.`
          : percent !== null
            ? `${finished} of ${trackable} stages finished.`
            : "Scan stages ready."}
      </p>
    </div>
  );
}
