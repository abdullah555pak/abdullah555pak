import type { FixStepData } from "@/lib/report-types";
import { FIX_PROCESS_STEPS } from "@/lib/fix-process";
import { FixChecklist } from "./FixChecklist";
import { BeginnerHelp } from "./BeginnerHelp";

interface FixGuideProps {
  fixSteps: FixStepData[] | null;
}

/**
 * Task 5 + 6: the fix guide has two parts. The generic explanation of
 * *how fixing works in Sitewell* (the same 7 steps on every issue page
 * - this is real product UX copy, not a fabricated finding) sits behind
 * a disclosure so it doesn't crowd out the issue-specific content. The
 * actual checklist below it is what's specific to this issue.
 */
export function FixGuide({ fixSteps }: FixGuideProps) {
  return (
    <section aria-labelledby="issue-fix-heading" className="flex flex-col gap-4">
      <h2 id="issue-fix-heading" className="text-lg font-semibold text-ink">
        Step-by-step fix guide
      </h2>

      <BeginnerHelp summary="How does fixing an issue work?">
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          {FIX_PROCESS_STEPS.map((step) => (
            <li key={step.id}>
              <span className="font-semibold text-ink">{step.title}.</span> {step.description}
            </li>
          ))}
        </ol>
      </BeginnerHelp>

      <FixChecklist fixSteps={fixSteps} />
    </section>
  );
}
