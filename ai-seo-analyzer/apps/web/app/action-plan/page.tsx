"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { PrioritySummary } from "@/components/report/PrioritySummary";
import { ActionPlanHeader } from "@/components/action-plan/ActionPlanHeader";
import { ActionPlanIntro } from "@/components/action-plan/ActionPlanIntro";
import { ActionPlanProgress } from "@/components/action-plan/ActionPlanProgress";
import { ActionSearch } from "@/components/action-plan/ActionSearch";
import { ActionFilters } from "@/components/action-plan/ActionFilters";
import { ActionList } from "@/components/action-plan/ActionList";
import { ActionDetail } from "@/components/action-plan/ActionDetail";
import { ActionUnavailableState } from "@/components/action-plan/ActionUnavailableState";
import { useActionFilters } from "@/hooks/useActionFilters";
import type { ActionPlanItem } from "@/lib/action-plan-types";

/**
 * No real action-plan store exists yet - every id lookup honestly
 * returns null, same pattern as app/report/issue/page.tsx's
 * findIssueById. A real function (not a hardcoded branch) so the
 * "not found" path runs through real logic a future backend lookup
 * can replace.
 */
function findActionById(_url: string, _id: string): ActionPlanItem | null {
  return null;
}

function ActionPlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const actionId = searchParams.get("id");

  // No real actions exist yet - called unconditionally (Rules of Hooks)
  // even on branches that never render the list.
  const filters = useActionFilters([]);

  const actionPlanHref = `/action-plan?url=${encodeURIComponent(url)}`;
  const scanHref = `/scan?url=${encodeURIComponent(url)}`;

  function goToAction(id: string) {
    router.push(`/action-plan?url=${encodeURIComponent(url)}&id=${encodeURIComponent(id)}`);
  }

  if (!url) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <ActionUnavailableState kind="no_scan" scanHref="/" />
      </div>
    );
  }

  if (actionId) {
    const action = findActionById(url, actionId);

    if (!action) {
      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          <EmptyState
            title="Action not found"
            description="We couldn't find this action. It may have already been resolved, or the link may be out of date."
            action={<ButtonLink href={actionPlanHref}>Back to action plan</ButtonLink>}
          />
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <ActionDetail action={action} url={url} actionPlanHref={actionPlanHref} scanHref={scanHref} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <ActionPlanHeader url={url} lastScannedAt={null} />

      <div className="mt-6 flex flex-col gap-6">
        <ActionPlanIntro />

        <ActionPlanProgress data={{ completedCount: null, remainingCount: null, needingVerificationCount: null }} />

        <PrioritySummary topIssues={[]} onSeeHowToFix={goToAction} />

        <section aria-labelledby="action-list-heading">
          <h2 id="action-list-heading" className="text-xl font-semibold text-ink">
            All actions
          </h2>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <ActionSearch value={filters.query} onChange={filters.setQuery} />
            </div>
            <ActionFilters
              category={filters.category}
              onCategoryChange={filters.setCategory}
              status={filters.status}
              onStatusChange={filters.setStatus}
            />
            <ActionList actions={filters.filtered} totalCount={0} scanHref={scanHref} onViewFixGuide={goToAction} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ActionPlanPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<p className="p-8 text-center text-sm text-muted">Loading…</p>}>
          <ActionPlanPageContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
