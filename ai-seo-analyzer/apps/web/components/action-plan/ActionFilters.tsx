import type { ActionCategoryFilterValue, ActionStatusFilterValue } from "@/hooks/useActionFilters";
import { ActionCategoryFilter } from "./ActionCategoryFilter";
import { ActionStatusFilter } from "./ActionStatusFilter";

interface ActionFiltersProps {
  category: ActionCategoryFilterValue;
  onCategoryChange: (value: ActionCategoryFilterValue) => void;
  status: ActionStatusFilterValue;
  onStatusChange: (value: ActionStatusFilterValue) => void;
}

/** Combines the category and status filters - collapses to a simple stacked control on mobile. */
export function ActionFilters({ category, onCategoryChange, status, onStatusChange }: ActionFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <ActionStatusFilter value={status} onChange={onStatusChange} />
      <ActionCategoryFilter value={category} onChange={onCategoryChange} />
    </div>
  );
}
