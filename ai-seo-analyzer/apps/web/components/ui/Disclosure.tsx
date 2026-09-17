import type { ReactNode } from "react";

interface DisclosureProps {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * Shared expand/collapse primitive, built on native <details>/<summary>
 * so keyboard and screen-reader support come for free. Used anywhere a
 * beginner shouldn't have to read something by default - e.g. "What is
 * SEO?" - without hiding it from anyone who wants it.
 */
export function Disclosure({ summary, children, defaultOpen = false }: DisclosureProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {summary}
        <span
          className="inline-block shrink-0 text-accent-strong transition-transform group-open:rotate-90"
          aria-hidden="true"
        >
          ›
        </span>
      </summary>
      <div className="mt-3 text-sm text-ink-soft">{children}</div>
    </details>
  );
}
