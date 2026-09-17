import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
}

/** Consistent heading row used above every section (issues group, data card grid, etc.). */
export function SectionHeader({ title, meta, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 mt-8 flex flex-wrap items-baseline justify-between gap-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {meta && <span className="text-sm text-muted">{meta}</span>}
      </div>
      {action}
    </div>
  );
}
