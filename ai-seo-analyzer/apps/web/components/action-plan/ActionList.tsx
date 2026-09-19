import type { ActionPlanItem } from "@/lib/action-plan-types";
import { REPORT_CATEGORIES } from "@/lib/report-types";
import { Card } from "@/components/ui/Card";
import { ActionCard } from "./ActionCard";
import { ActionEmptyState } from "./ActionEmptyState";
import { ActionUnavailableState } from "./ActionUnavailableState";

interface ActionListProps {
  /** Already filtered/sorted by useActionFilters. */
  actions: ActionPlanItem[];
  /** The real, unfiltered total - distinguishes "nothing exists yet" from "no matches". */
  totalCount: number;
  scanHref?: string;
  onViewFixGuide?: (actionId: string) => void;
}

/**
 * Task 2's category grouping: actions are shown under a heading per
 * SEO category (in the same fixed order as the report's categories),
 * skipping any category with nothing in the current filtered set.
 */
export function ActionList({ actions, totalCount, scanHref, onViewFixGuide }: ActionListProps) {
  if (totalCount === 0) {
    return (
      <Card>
        <ActionEmptyState scanHref={scanHref} />
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card>
        <ActionUnavailableState kind="no_matches" />
      </Card>
    );
  }

  const groups = REPORT_CATEGORIES.map((category) => ({
    category,
    items: actions.filter((action) => action.category === category.id),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ category, items }) => (
        <section key={category.id} aria-labelledby={`action-group-${category.id}`}>
          <h3 id={`action-group-${category.id}`} className="text-sm font-semibold uppercase tracking-wide text-muted">
            {category.title}
          </h3>
          <Card className="mt-2 p-0">
            <ul className="flex flex-col px-5">
              {items.map((action) => (
                <ActionCard key={action.id} action={action} onViewFixGuide={onViewFixGuide} />
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}
