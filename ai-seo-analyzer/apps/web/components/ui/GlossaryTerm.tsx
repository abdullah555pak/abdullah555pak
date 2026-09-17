"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { glossary } from "@/lib/glossary";

interface GlossaryTermProps {
  term: keyof typeof glossary;
  children: ReactNode;
}

/**
 * Wraps a technical word with a plain-language definition, toggled by
 * click/Enter (not hover-only, so it works on touch and for keyboard
 * users) and closable with Escape. This is the app's one mechanism for
 * explaining jargon - never link a term away to another page.
 */
export function GlossaryTerm({ term, children }: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const definition = glossary[term];

  if (!definition) return <>{children}</>;

  return (
    <span className="relative inline">
      <button
        type="button"
        className="cursor-help border-b border-dotted border-muted text-inherit"
        aria-expanded={open}
        aria-describedby={open ? popoverId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => setOpen(false)}
      >
        {children}
      </button>
      {open && (
        <span
          id={popoverId}
          role="tooltip"
          className="absolute left-0 top-full z-10 mt-1.5 w-64 max-w-[80vw] rounded-lg border border-border bg-surface p-3 text-sm font-normal normal-case text-ink-soft shadow-lg"
        >
          {definition}
        </span>
      )}
    </span>
  );
}
