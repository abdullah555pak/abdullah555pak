import { useId } from "react";

interface IssueSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/** Task 5's search field, labeled and keyboard-usable like every other input in the app. */
export function IssueSearch({ value, onChange }: IssueSearchProps) {
  const inputId = useId();
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-xs font-semibold text-ink-soft">
        Search issues
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. meta description"
        className="min-h-[40px] w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}
