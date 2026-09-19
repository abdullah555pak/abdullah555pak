import type { ActionStatusFilterValue } from "@/hooks/useActionFilters";
import { ACTION_STATUS_FILTER_ORDER, ACTION_STATUS_META } from "@/lib/action-plan-types";

interface ActionStatusFilterProps {
  value: ActionStatusFilterValue;
  onChange: (value: ActionStatusFilterValue) => void;
}

/** Task 8: All + the 5 filterable statuses, as pill buttons like the Problems page's severity filter. */
export function ActionStatusFilter({ value, onChange }: ActionStatusFilterProps) {
  const options: ActionStatusFilterValue[] = ["all", ...ACTION_STATUS_FILTER_ORDER];

  return (
    <div role="group" aria-label="Filter actions by status" className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = value === option;
        const label = option === "all" ? "All" : ACTION_STATUS_META[option].label;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`min-h-[36px] rounded-full border px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface text-ink-soft hover:border-accent hover:text-accent-strong"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
