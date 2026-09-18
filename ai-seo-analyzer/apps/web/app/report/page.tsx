"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { REPORT_CATEGORIES, type ReportMeta } from "@/lib/report-types";
import { ReportHeader } from "@/components/report/ReportHeader";
import { ReportNavigation, type ReportNavItem } from "@/components/report/ReportNavigation";
import { ReportSection } from "@/components/report/ReportSection";
import { HealthSummary } from "@/components/report/HealthSummary";
import { PrioritySummary } from "@/components/report/PrioritySummary";
import { CategoryReportCard } from "@/components/report/CategoryReportCard";
import { IssueSearch } from "@/components/report/IssueSearch";
import { IssueFilters } from "@/components/report/IssueFilters";
import { IssueList } from "@/components/report/IssueList";
import { ReportStatusMessage } from "@/components/report/ReportStatusMessage";
import { useIssueFilters } from "@/hooks/useIssueFilters";

const NAV_ITEMS: ReportNavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "problems", label: "Problems" },
  ...REPORT_CATEGORIES.map((c) => ({ id: c.id, label: c.title })),
  { id: "action-plan", label: "Action Plan" },
];

function ReportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const activeSection = searchParams.get("section") ?? "overview";
  // Called unconditionally (Rules of Hooks) even though the "no url"
  // branch below never renders anything that uses it.
  const filters = useIssueFilters([]);

  function goToSection(id: string) {
    router.push(`/report?url=${encodeURIComponent(url)}&section=${id}`);
  }

  function goToIssue(issueId: string) {
    router.push(`/report/issue?url=${encodeURIComponent(url)}&id=${encodeURIComponent(issueId)}`);
  }

  if (!url) {
    return <ReportStatusMessage kind="not_found" scanHref="/" />;
  }

  // Nothing here is fabricated: no scan has ever completed, so every
  // number is null and every confidence is "unavailable" (Tasks 1, 12, 14).
  const meta: ReportMeta = { url, scannedAt: null, status: "not_found" };
  const scanHref = `/scan?url=${encodeURIComponent(url)}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <ReportHeader meta={meta} />

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <aside className="shrink-0 md:w-56">
          <ReportNavigation items={NAV_ITEMS} activeId={activeSection} onSelect={goToSection} />
        </aside>

        <div className="min-w-0 flex-1">
          {activeSection === "overview" && (
            <div className="flex flex-col gap-6">
              <HealthSummary
                data={{
                  overallScore: null,
                  criticalCount: null,
                  importantCount: null,
                  improvementCount: null,
                  confidence: "unavailable",
                }}
              />
              <PrioritySummary topIssues={[]} onSeeHowToFix={goToIssue} />
              <ReportSection
                title="Browse by category"
                description="Each area of your site's SEO, checked separately."
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {REPORT_CATEGORIES.map((category) => (
                    <CategoryReportCard
                      key={category.id}
                      category={{ ...category, issueCount: null, confidence: "unavailable" }}
                      onViewDetails={goToSection}
                    />
                  ))}
                </div>
              </ReportSection>
            </div>
          )}

          {activeSection === "problems" && (
            <ReportSection
              title="Problems"
              description="Every issue we find will be listed here, most important first."
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <IssueSearch value={filters.query} onChange={filters.setQuery} />
                </div>
                <IssueFilters
                  severity={filters.severity}
                  onSeverityChange={filters.setSeverity}
                  category={filters.category}
                  onCategoryChange={filters.setCategory}
                  sort={filters.sort}
                  onSortChange={filters.setSort}
                />
                <IssueList issues={filters.filtered} totalCount={0} onView={goToIssue} />
              </div>
            </ReportSection>
          )}

          {activeSection === "action-plan" && (
            <ReportSection
              title="Action plan"
              description="A prioritized, step-by-step to-do list built from your results."
            >
              <PrioritySummary topIssues={[]} onSeeHowToFix={goToIssue} />
            </ReportSection>
          )}

          {REPORT_CATEGORIES.some((c) => c.id === activeSection) && (
            <ReportSection
              title={REPORT_CATEGORIES.find((c) => c.id === activeSection)!.title}
              description={REPORT_CATEGORIES.find((c) => c.id === activeSection)!.description}
              confidence="unavailable"
            >
              <ReportStatusMessage kind="unavailable" scanHref={scanHref} />
            </ReportSection>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<p className="p-8 text-center text-sm text-muted">Loading…</p>}>
          <ReportPageContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
