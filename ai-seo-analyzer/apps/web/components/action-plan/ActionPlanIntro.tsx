import { BeginnerHelp } from "@/components/issue/BeginnerHelp";

/** Task 1 + 13: what this page is, in one sentence, plus optional beginner help. */
export function ActionPlanIntro() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">
        Every problem we find on your website gets turned into a clear, ordered task here, so you
        always know what to work on next.
      </p>
      <BeginnerHelp summary="What is an SEO Action Plan?">
        An SEO Action Plan turns website problems into clear tasks so you know what to work on and
        what to do next.
      </BeginnerHelp>
    </div>
  );
}
