import type { FixStepData } from "@/lib/report-types";
import { FIX_INSTRUCTION_TYPE_LABELS } from "@/lib/fix-process";
import { Badge } from "@/components/ui/Badge";
import { BeginnerHelp } from "./BeginnerHelp";

interface FixStepProps {
  step: FixStepData;
  index: number;
  checked: boolean;
  onToggle: (id: string) => void;
}

/** Task 6: one item in an issue's fix checklist - checkbox, title, description, optional help and link. */
export function FixStep({ step, index, checked, onToggle }: FixStepProps) {
  const inputId = `fix-step-${step.id}`;

  return (
    <li className="flex gap-3 border-b border-border py-3 last:border-b-0">
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(step.id)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-border text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={inputId} className="flex flex-wrap items-center gap-2">
          <span className={`font-semibold ${checked ? "text-muted line-through" : "text-ink"}`}>
            {index + 1}. {step.title}
          </span>
          {step.instructionType && <Badge tone="info">{FIX_INSTRUCTION_TYPE_LABELS[step.instructionType]}</Badge>}
        </label>
        <p className="mt-0.5 text-sm text-ink-soft">{step.description}</p>
        {step.helpText && (
          <div className="mt-1.5">
            <BeginnerHelp summary="Need more help with this step?">{step.helpText}</BeginnerHelp>
          </div>
        )}
        {step.actionHref && step.actionLabel && (
          <a
            href={step.actionHref}
            className="mt-1.5 inline-block text-sm font-semibold text-accent-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {step.actionLabel}
          </a>
        )}
      </div>
    </li>
  );
}
