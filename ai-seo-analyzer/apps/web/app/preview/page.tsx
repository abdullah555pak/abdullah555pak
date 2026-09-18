"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/ui/ConfidenceBadge";
import { PriorityBadge, type PriorityLevel } from "@/components/ui/PriorityBadge";
import { SeverityBadge, SEVERITY_ORDER } from "@/components/ui/SeverityBadge";
import { GlossaryTerm } from "@/components/ui/GlossaryTerm";
import { ScanProgress } from "@/components/scan/ScanProgress";
import { ScanHeader } from "@/components/scan/ScanHeader";
import { ScanStatus } from "@/components/scan/ScanStatus";
import { ScanError } from "@/components/scan/ScanError";
import { ScanCompleted } from "@/components/scan/ScanCompleted";
import { PartialScanNotice } from "@/components/scan/PartialScanNotice";
import { CancelScanDialog } from "@/components/scan/CancelScanDialog";
import { ScanSummary } from "@/components/scan/ScanSummary";
import { SCAN_STAGE_DEFINITIONS, initialStageStates, type ScanStageState } from "@/lib/scan-stages";
import type { ScanPhase } from "@/lib/scan-machine";
import { REPORT_CATEGORIES, type ReportIssue } from "@/lib/report-types";
import { ReportHeader } from "@/components/report/ReportHeader";
import { ReportNavigation, type ReportNavItem } from "@/components/report/ReportNavigation";
import { HealthSummary } from "@/components/report/HealthSummary";
import { PrioritySummary } from "@/components/report/PrioritySummary";
import { CategoryReportCard } from "@/components/report/CategoryReportCard";
import { IssueSearch } from "@/components/report/IssueSearch";
import { IssueFilters } from "@/components/report/IssueFilters";
import { IssueList } from "@/components/report/IssueList";
import { ReportStatusMessage } from "@/components/report/ReportStatusMessage";
import { useIssueFilters } from "@/hooks/useIssueFilters";
import { IssueDetailHeader } from "@/components/issue/IssueDetailHeader";
import { IssueExplanation } from "@/components/issue/IssueExplanation";
import { WhyItMatters } from "@/components/issue/WhyItMatters";
import { EvidencePanel } from "@/components/issue/EvidencePanel";
import { FixGuide } from "@/components/issue/FixGuide";
import { DifficultyBadge } from "@/components/issue/DifficultyBadge";
import { ImpactBadge } from "@/components/issue/ImpactBadge";
import { ReadyToVerify } from "@/components/issue/ReadyToVerify";
import { VerificationState } from "@/components/issue/VerificationState";
import { NextActionPanel } from "@/components/issue/NextActionPanel";
import type { VerificationStatus } from "@/lib/report-types";

const SCAN_PHASES: ScanPhase[] = [
  "idle",
  "validating",
  "starting",
  "scanning",
  "cancelling",
  "completed",
  "partial",
  "failed",
  "unavailable",
];

function stagesAtStep(step: number): ScanStageState[] {
  return SCAN_STAGE_DEFINITIONS.map((stage, index) => ({
    ...stage,
    status: index < step ? "completed" : index === step ? "running" : "pending",
  }));
}

const PRIORITIES: PriorityLevel[] = ["critical", "important", "improvement", "good"];
const CONFIDENCES: ConfidenceLevel[] = ["verified", "estimated", "detected", "unavailable"];

// Template content only - not a real SEO finding. Used exclusively to
// review the report components' layout, never rendered on a real page.
const TEMPLATE_ISSUES: ReportIssue[] = SEVERITY_ORDER.map((severity, index) => ({
  id: `template-${index}`,
  title: "Example issue title goes here",
  shortExplanation: "Example one-line explanation goes here.",
  whyItMatters: "Example explanation of why this would matter goes here.",
  whyItMattersDetail: null,
  severity,
  category: REPORT_CATEGORIES[index % REPORT_CATEGORIES.length].id,
  affectedPages: (index + 1) * 2,
  source: "Example check name",
  evidence: [
    {
      confidence: CONFIDENCES[index % CONFIDENCES.length],
      url: "https://example.com/page",
      htmlElement: "<title>",
      detectedValue: "Example detected value",
      expectedValue: "Example expected value",
      technicalDetails: "Example technical detail text goes here.",
      screenshotUrl: null,
    },
  ],
  confidence: CONFIDENCES[index % CONFIDENCES.length],
  fixAvailable: index % 2 === 0,
  fixSteps: [
    {
      id: "step-1",
      title: "Example fix step one",
      description: "Example description of the first thing to change.",
      helpText: "Example extra help text for beginners.",
      instructionType: "website-code",
      actionLabel: null,
      actionHref: null,
    },
    {
      id: "step-2",
      title: "Example fix step two",
      description: "Example description of the second thing to change.",
      helpText: null,
      instructionType: "metadata",
      actionLabel: null,
      actionHref: null,
    },
  ],
  difficulty: "moderate",
  expectedImpact: "medium",
  detectedAt: "2026-01-01",
  verification: { status: "not_verified", lastCheckedAt: null },
  relatedIssueIds: [],
}));

// A single, fuller example issue for the Issue Detail page component
// gallery below - template content only, same rule as TEMPLATE_ISSUES.
const TEMPLATE_DETAIL_ISSUE: ReportIssue = {
  ...TEMPLATE_ISSUES[0],
  id: "template-detail",
  whyItMattersDetail: {
    seoImpact: "Example: search engines may struggle to understand this page.",
    userExperienceImpact: "Example: visitors may find this confusing.",
    searchEngineImpact: "Example: this page may rank lower than it could.",
    businessImpact: "Example: this could mean fewer visitors convert into customers.",
  },
};

const VERIFICATION_STATUSES: VerificationStatus[] = [
  "not_verified",
  "fixed",
  "improved",
  "still_needs_attention",
  "unable_to_verify",
  "partially_fixed",
];

const REPORT_NAV_ITEMS: ReportNavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "problems", label: "Problems" },
  ...REPORT_CATEGORIES.map((c) => ({ id: c.id, label: c.title })),
  { id: "action-plan", label: "Action Plan" },
];

/**
 * Internal, development-only component gallery. Not linked from any
 * real navigation. Everything below is example/template content for
 * visual and accessibility review - none of it is a real scan, a real
 * finding, or real data of any kind.
 */
export default function PreviewPage() {
  const [stages, setStages] = useState<ScanStageState[]>(() => initialStageStates());
  const [playing, setPlaying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [navActive, setNavActive] = useState("overview");
  const filters = useIssueFilters(TEMPLATE_ISSUES);

  useEffect(() => {
    if (!playing) return;
    let step = 0;
    setStages(stagesAtStep(0));
    const interval = setInterval(() => {
      step += 1;
      if (step >= SCAN_STAGE_DEFINITIONS.length) {
        setStages(SCAN_STAGE_DEFINITIONS.map((s) => ({ ...s, status: "completed" })));
        setPlaying(false);
        return;
      }
      setStages(stagesAtStep(step));
    }, 700);
    return () => clearInterval(interval);
  }, [playing]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div
          role="note"
          className="rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-sm text-gold"
        >
          <p className="font-semibold">Development-only component preview</p>
          <p className="mt-1">
            This page exists only to review UI components while building them. Nothing on it is
            real data, a real scan, or a real finding — it is not part of the product experience.
          </p>
        </div>

        <SectionHeader title="Buttons" />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Analyze Website</Button>
          <Button variant="primary" disabled>
            Starting analysis...
          </Button>
          <Button variant="secondary">Re-scan</Button>
          <Button variant="secondary" size="sm">
            Show technical details
          </Button>
        </div>

        <SectionHeader title="Badges" />
        <div className="flex flex-wrap items-center gap-2">
          {CONFIDENCES.map((level) => (
            <ConfidenceBadge key={level} level={level} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {PRIORITIES.map((level) => (
            <PriorityBadge key={level} level={level} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {SEVERITY_ORDER.map((level) => (
            <SeverityBadge key={level} severity={level} />
          ))}
        </div>

        <SectionHeader title="Cards, empty, and error states" />
        <div className="flex flex-col gap-3">
          <Card>A plain card — the shared shell every panel in the app uses.</Card>
          <EmptyState
            title="Not implemented yet"
            description="Example of how an unbuilt or unavailable section explains itself."
          />
          <ErrorState message="Example of an inline error message, in plain language." />
        </div>

        <SectionHeader title="Glossary term" />
        <p className="text-sm text-ink-soft">
          Example sentence using a <GlossaryTerm term="backlink">backlink</GlossaryTerm>, a{" "}
          <GlossaryTerm term="canonical">canonical tag</GlossaryTerm>, and{" "}
          <GlossaryTerm term="core web vitals">Core Web Vitals</GlossaryTerm> — click any of these
          to see the plain-language definition.
        </p>

        <SectionHeader title="Scan header + status" />
        <p className="mb-3 text-xs text-muted">One status line per phase in the state model.</p>
        <Card className="flex flex-col gap-2">
          {SCAN_PHASES.map((phase) => (
            <ScanStatus key={phase} phase={phase} />
          ))}
        </Card>

        <SectionHeader
          title="Scan progress"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setStages(initialStageStates());
                setPlaying(true);
              }}
            >
              Play demo animation
            </Button>
          }
        />
        <p className="mb-3 text-xs text-muted">
          Demo animation for design review only — no real scan is running. In production, every
          stage stays "pending" because the backend doesn't perform any of them yet.
        </p>
        <Card>
          <ScanHeader
            url="example.com"
            phase="scanning"
            explanation="Example explanation text for design review."
          />
          <div className="mt-6">
            <ScanProgress stages={stages} />
          </div>
        </Card>

        <SectionHeader title="Cancel scan dialog" />
        <p className="mb-3 text-xs text-muted">Confirmation is safe-by-default (focus starts on "Keep Waiting").</p>
        <Button size="sm" variant="secondary" onClick={() => setDialogOpen(true)}>
          Open cancel dialog
        </Button>
        {dialogOpen && (
          <CancelScanDialog onConfirm={() => setDialogOpen(false)} onDismiss={() => setDialogOpen(false)} />
        )}

        <SectionHeader title="Scan outcomes" />
        <p className="mb-3 text-xs text-muted">
          Completed and Partial aren&apos;t reachable in production yet — the backend never
          returns success. Unavailable and Failed are the two outcomes the real app can show
          today.
        </p>
        <div className="flex flex-col gap-4">
          <Card>
            <ScanError
              variant="unavailable"
              message="Website analysis isn't built yet. We checked that this address is safe to scan, but the crawler and SEO engine are coming in a later development step."
            />
          </Card>
          <Card>
            <ScanError
              variant="failed"
              message="We couldn't reach the Sitewell server. Is the API running?"
              onTryAgain={() => {}}
            />
          </Card>
          <Card>
            <ScanCompleted url="example.com" reportHref="#" />
          </Card>
          <Card>
            <PartialScanNotice
              url="example.com"
              limitations={["3 pages couldn't be reached.", "Performance data timed out for 1 page."]}
              reportHref="#"
            />
          </Card>
        </div>

        <SectionHeader title="Scan summary (large-site support)" />
        <Card>
          <ScanSummary />
        </Card>

        <SectionHeader title="Report status messages" />
        <p className="mb-3 text-xs text-muted">
          Every "nothing to show" state the report can be in - note "no matches" reads
          differently from "not available yet."
        </p>
        <div className="flex flex-col gap-3">
          {(["loading", "not_found", "processing", "partial", "failed", "unavailable", "no_matches"] as const).map(
            (kind) => (
              <Card key={kind}>
                <p className="mb-2 font-mono text-xs text-muted">{kind}</p>
                <ReportStatusMessage kind={kind} scanHref="#" />
              </Card>
            )
          )}
        </div>

        <SectionHeader title="Report header" />
        <Card>
          <ReportHeader meta={{ url: "example.com", scannedAt: null, status: "not_found" }} />
        </Card>

        <SectionHeader title="Health summary" />
        <p className="mb-3 text-xs text-muted">No fake score - "—" until a real scan produces one.</p>
        <HealthSummary
          data={{
            overallScore: null,
            criticalCount: null,
            importantCount: null,
            improvementCount: null,
            confidence: "unavailable",
          }}
        />

        <SectionHeader title="Priority summary ('What should I fix first?')" />
        <p className="mb-3 text-xs text-muted">
          Real (empty) state, then a template-content example with the top 3 items.
        </p>
        <div className="flex flex-col gap-3">
          <PrioritySummary topIssues={[]} />
          <PrioritySummary topIssues={TEMPLATE_ISSUES.slice(0, 3)} />
        </div>

        <SectionHeader title="Category report cards" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REPORT_CATEGORIES.slice(0, 4).map((category) => (
            <CategoryReportCard
              key={category.id}
              category={{ ...category, issueCount: null, confidence: "unavailable" }}
            />
          ))}
        </div>

        <SectionHeader title="Report navigation" />
        <p className="mb-3 text-xs text-muted">Sidebar on desktop, dropdown below md width.</p>
        <Card>
          <ReportNavigation items={REPORT_NAV_ITEMS} activeId={navActive} onSelect={setNavActive} />
        </Card>

        <SectionHeader title="Issue search, filters, and list" />
        <p className="mb-3 text-xs text-muted">
          Template issues below (not real findings) demonstrate the working filter/search/sort
          controls. The real Problems page starts with zero issues and shows the honest
          "not available yet" message instead.
        </p>
        <div className="flex flex-col gap-4">
          <IssueSearch value={filters.query} onChange={filters.setQuery} />
          <IssueFilters
            severity={filters.severity}
            onSeverityChange={filters.setSeverity}
            category={filters.category}
            onCategoryChange={filters.setCategory}
            sort={filters.sort}
            onSortChange={filters.setSort}
          />
          <IssueList issues={filters.filtered} totalCount={TEMPLATE_ISSUES.length} />
        </div>

        <SectionHeader title="Issue detail page (Step 06)" />
        <p className="mb-3 text-xs text-muted">
          Template content below (static UI documentation, not a real finding) demonstrating the
          full Issue Detail page component set. In production, the real issue detail page always
          shows an honest "Issue not found" state today, since there is no real issue store yet.
        </p>
        <Card className="flex flex-col gap-6">
          <IssueDetailHeader issue={TEMPLATE_DETAIL_ISSUE} />
          <IssueExplanation issue={TEMPLATE_DETAIL_ISSUE} />
          <WhyItMatters issue={TEMPLATE_DETAIL_ISSUE} />
          <div>
            <h3 className="text-lg font-semibold text-ink">Evidence</h3>
            <div className="mt-2">
              <EvidencePanel evidence={TEMPLATE_DETAIL_ISSUE.evidence} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-semibold text-muted">Difficulty</p>
              <div className="mt-1">
                <DifficultyBadge difficulty={TEMPLATE_DETAIL_ISSUE.difficulty} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Expected impact</p>
              <div className="mt-1">
                <ImpactBadge impact={TEMPLATE_DETAIL_ISSUE.expectedImpact} />
              </div>
            </div>
          </div>
          <FixGuide fixSteps={TEMPLATE_DETAIL_ISSUE.fixSteps} />
          <ReadyToVerify url="example.com" />
          <NextActionPanel reportHref="#" scanHref="#" />
        </Card>

        <SectionHeader title="Evidence panel - unavailable state" />
        <Card>
          <EvidencePanel evidence={null} />
        </Card>

        <SectionHeader title="Fix guide - no issue-specific steps yet" />
        <Card>
          <FixGuide fixSteps={null} />
        </Card>

        <SectionHeader title="Verification states" />
        <p className="mb-3 text-xs text-muted">
          "Not verified" is the only state the real app can show today - the rest exist so the UI
          is ready once real re-scans can check a specific fix.
        </p>
        <div className="flex flex-col gap-3">
          {VERIFICATION_STATUSES.map((status) => (
            <Card key={status}>
              <VerificationState status={status} lastCheckedAt={status === "not_verified" ? null : "2026-01-01"} />
            </Card>
          ))}
        </div>

        <SectionHeader title="Issue detail - error and empty states" />
        <div className="flex flex-col gap-3">
          <EmptyState title="Scan required" description="Analyze a website first to see details about a specific issue." />
          <EmptyState title="Report unavailable" description="We don't have a report to show issue details from yet." />
          <EmptyState
            title="Issue not found"
            description="We couldn't find this issue. It may have already been resolved, or the link may be out of date."
          />
          <EmptyState title="Issue data unavailable" description="We found this issue, but couldn't load its full details." />
        </div>
      </main>
      <Footer />
    </div>
  );
}
