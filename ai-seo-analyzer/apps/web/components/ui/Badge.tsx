import type { HTMLAttributes, ReactNode } from "react";

export type Tone = "good" | "warn" | "critical" | "info" | "gold" | "muted";

const toneClasses: Record<Tone, string> = {
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  critical: "bg-critical-soft text-critical",
  info: "bg-info-soft text-info",
  gold: "bg-gold-soft text-gold",
  muted: "bg-surface-2 text-muted",
};

interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> {
  tone: Tone;
  children: ReactNode;
  className?: string;
}

/** Small colored pill. Base primitive for ConfidenceBadge and PriorityBadge - never used with a new color meaning of its own. */
export function Badge({ tone, children, className = "", ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}
