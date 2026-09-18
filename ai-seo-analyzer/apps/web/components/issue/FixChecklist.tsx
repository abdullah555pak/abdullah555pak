"use client";

import { useState } from "react";
import type { FixStepData } from "@/lib/report-types";
import { EmptyState } from "@/components/ui/EmptyState";
import { FixStep } from "./FixStep";

interface FixChecklistProps {
  fixSteps: FixStepData[] | null;
}

/**
 * Task 6: the issue-specific checklist built from `issue.fixSteps`.
 * Completion state is keyed by step id in a plain `{ [id]: boolean }`
 * shape so it can be persisted later (e.g. per issue+step id) without
 * changing this component - today it just lives in memory for the
 * session, since there's nowhere real to save it yet.
 */
export function FixChecklist({ fixSteps }: FixChecklistProps) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  if (!fixSteps || fixSteps.length === 0) {
    return (
      <EmptyState
        title="Fix guide unavailable"
        description="A specific, step-by-step checklist for this issue isn't available yet."
      />
    );
  }

  function toggle(id: string) {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const doneCount = fixSteps.filter((step) => completed[step.id]).length;

  return (
    <div>
      <p className="text-xs font-semibold text-muted">
        {doneCount} of {fixSteps.length} steps checked off
      </p>
      <ul className="mt-2">
        {fixSteps.map((step, index) => (
          <FixStep key={step.id} step={step} index={index} checked={!!completed[step.id]} onToggle={toggle} />
        ))}
      </ul>
    </div>
  );
}
