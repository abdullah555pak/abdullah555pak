import type { ActionPlanItem } from "@/lib/action-plan-types";
import { IssueDetailHeader } from "@/components/issue/IssueDetailHeader";
import { IssueExplanation } from "@/components/issue/IssueExplanation";
import { WhyItMatters } from "@/components/issue/WhyItMatters";
import { EvidencePanel } from "@/components/issue/EvidencePanel";
import { FixGuide } from "@/components/issue/FixGuide";
import { ReadyToVerify } from "@/components/issue/ReadyToVerify";
import { NextActionPanel } from "@/components/issue/NextActionPanel";
import { ActionStatusBadge } from "./ActionStatusBadge";

interface ActionDetailProps {
  action: ActionPlanItem;
  url: string;
  actionPlanHref: string;
  scanHref: string;
}

/**
 * Task 10: an action's detail view is an issue's detail view, plus its
 * plan-tracking status - so it's built entirely from Step 06's Issue
 * Detail / Fix Guide components (an ActionPlanItem is a ReportIssue),
 * never a second copy of that UI.
 */
export function ActionDetail({ action, url, actionPlanHref, scanHref }: ActionDetailProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <IssueDetailHeader issue={action} />
        <div className="mt-2">
          <ActionStatusBadge status={action.status} />
        </div>
      </div>

      <IssueExplanation issue={action} />
      <WhyItMatters issue={action} />

      <section aria-labelledby="action-evidence-heading">
        <h2 id="action-evidence-heading" className="text-lg font-semibold text-ink">
          Evidence
        </h2>
        <div className="mt-2">
          <EvidencePanel evidence={action.evidence} />
        </div>
      </section>

      <FixGuide fixSteps={action.fixSteps} />

      <ReadyToVerify url={url} />

      <NextActionPanel reportHref={actionPlanHref} scanHref={scanHref} />
    </div>
  );
}
