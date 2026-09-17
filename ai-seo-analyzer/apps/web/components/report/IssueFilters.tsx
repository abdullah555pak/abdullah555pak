import type { CategoryFilter, IssueSortOption, SeverityFilter } from "@/hooks/useIssueFilters";
import { SORT_OPTIONS } from "@/hooks/useIssueFilters";
import { SEVERITY_ORDER, severityMeta } from "@/components/ui/SeverityBadge";
import { REPORT_CATEGORIES } from "@/lib/report-types";

interface IssueFiltersProps {
  severity: SeverityFilter;
  onSeverityChange: (value: SeverityFilter) => void;
  category: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  sort: IssueSortOption;
  onSortChange: (value: IssueSortOption) => void;
}

const selectClass =
  "min-h-[40px] rounded-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

/**
 * Task 5: severity filter pills, a category dropdown, and a sort
 * control. These are real, wired controls (see hooks/useIssueFilters)
 * even though the list they filter is empty today - clicking them
 * always works, it just has nothing to show yet.
 */
export function IssueFilters({
  severity,
  onSeverityChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}: IssueFiltersProps) {
  const severityOptions: SeverityFilter[] = ["all", ...SEVERITY_ORDER];

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Filter issues by severity" className="flex flex-wrap gap-1.5">
        {severityOptions.map((option) => {
          const active = severity === option;
          const label = option === "all" ? "All" : severityMeta[option].label;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onSeverityChange(option)}
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

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
          Category
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as CategoryFilter)}
            className={selectClass}
          >
            <option value="all">All categories</option>
            {REPORT_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
          Sort by
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as IssueSortOption)}
            className={selectClass}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
