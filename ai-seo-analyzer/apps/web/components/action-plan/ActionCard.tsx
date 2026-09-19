import type { ActionPlanItem } from "@/lib/action-plan-types";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { DifficultyBadge } from "@/components/issue/DifficultyBadge";
import { ImpactBadge } from "@/components/issue/ImpactBadge";
import { Button } from "@/components/ui/Button";
import { ActionStatusBadge } from "./ActionStatusBadge";

interface ActionCardProps {
  action: ActionPlanItem;
  onViewFixGuide?: (actionId: string) => void;
}

/**
 * Task 5: the reusable action row. Priority reuses SeverityBadge (same
 * "priority" ≡ "severity" convention as the rest of the report/issue
 * system) and data confidence reuses ConfidenceBadge, rather than
 * introducing near-duplicate badge components.
 */
export function ActionCard({ action, onViewFixGuide }: ActionCardProps) {
  return (
    <li className="flex flex-col gap-2 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-muted" aria-hidden="true">
            #{action.order}
          </span>
          <SeverityBadge severity={action.severity} />
          <ActionStatusBadge status={action.status} />
          <ConfidenceBadge level={action.confidence} />
        </div>
        <h3 className="mt-1.5 font-semibold text-ink">{action.title}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">{action.shortExplanation}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>
            {action.affectedPages === null
              ? "Affected pages: not available yet"
              : `Affects ${action.affectedPages} page${action.affectedPages === 1 ? "" : "s"}`}
          </span>
          <span className="flex items-center gap-1">
            Difficulty: <DifficultyBadge difficulty={action.difficulty} />
          </span>
          <span className="flex items-center gap-1">
            Impact: <ImpactBadge impact={action.expectedImpact} />
          </span>
        </div>
      </div>
      <Button size="sm" variant="secondary" onClick={() => onViewFixGuide?.(action.id)} className="shrink-0">
        View Fix Guide
      </Button>
    </li>
  );
}
