export interface ReportNavItem {
  id: string;
  label: string;
}

interface ReportNavigationProps {
  items: ReportNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Task 8: one clean nav, two renderings of the same state - a sidebar
 * list on desktop, a dropdown on mobile (a 14-item horizontal tab bar
 * would either wrap awkwardly or force horizontal scrolling, which the
 * mobile requirements explicitly rule out).
 */
export function ReportNavigation({ items, activeId, onSelect }: ReportNavigationProps) {
  return (
    <nav aria-label="Report sections">
      {/* Mobile: dropdown */}
      <div className="md:hidden">
        <label htmlFor="report-nav-select" className="sr-only">
          Jump to report section
        </label>
        <select
          id="report-nav-select"
          value={activeId}
          onChange={(event) => onSelect(event.target.value)}
          className="min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: sidebar */}
      <ul className="hidden flex-col gap-0.5 md:flex">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onSelect(item.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  active
                    ? "bg-accent-soft text-accent-strong"
                    : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
