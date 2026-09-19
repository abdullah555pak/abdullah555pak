import { useId } from "react";

interface ActionSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/** Task 9: search by action name, problem, or category - labeled and mobile-friendly. */
export function ActionSearch({ value, onChange }: ActionSearchProps) {
  const inputId = useId();
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-xs font-semibold text-ink-soft">
        Search actions
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. meta description"
        className="min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}
