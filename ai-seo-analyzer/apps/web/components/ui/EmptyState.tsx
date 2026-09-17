import type { ReactNode } from "react";
import { Card } from "./Card";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Used whenever a section has no data - always explains *why* it's empty
 * and, when possible, what would fill it. Never a blank card or silent
 * gap (see docs/BLUEPRINT.md Section 8, "Unavailable" data rule).
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-start gap-2 border-dashed bg-surface-2/60 text-left">
      <p className="font-semibold text-ink">{title}</p>
      <p className="text-sm text-muted">{description}</p>
      {action}
    </Card>
  );
}
