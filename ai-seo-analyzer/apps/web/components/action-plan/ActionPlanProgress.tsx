import { Card } from "@/components/ui/Card";

export interface ActionPlanProgressData {
  /** All three null until a real scan has produced real actions - never a guessed percentage. */
  completedCount: number | null;
  remainingCount: number | null;
  needingVerificationCount: number | null;
}

interface ActionPlanProgressProps {
  data: ActionPlanProgressData;
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-3 py-3">
      <span className="font-mono text-xl font-bold text-ink">{value ?? "—"}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

/** Task 11: never a fake percentage - real counts once real actions exist, "—" until then. */
export function ActionPlanProgress({ data }: ActionPlanProgressProps) {
  const hasData = data.completedCount !== null;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">Progress</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Completed" value={data.completedCount} />
        <Stat label="Remaining" value={data.remainingCount} />
        <Stat label="Needing verification" value={data.needingVerificationCount} />
      </div>
      {!hasData && (
        <p className="mt-3 text-sm text-muted">Progress will appear after your website has been analyzed.</p>
      )}
    </Card>
  );
}
