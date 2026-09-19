import type { ActionCategoryFilterValue } from "@/hooks/useActionFilters";
import { REPORT_CATEGORIES } from "@/lib/report-types";

interface ActionCategoryFilterProps {
  value: ActionCategoryFilterValue;
  onChange: (value: ActionCategoryFilterValue) => void;
}

/** Task 7: All + the 11 SEO categories. */
export function ActionCategoryFilter({ value, onChange }: ActionCategoryFilterProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
      Category
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ActionCategoryFilterValue)}
        className="min-h-[40px] rounded-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
      >
        <option value="all">All categories</option>
        {REPORT_CATEGORIES.map((category) => (
          <option key={category.id} value={category.id}>
            {category.title}
          </option>
        ))}
      </select>
    </label>
  );
}
