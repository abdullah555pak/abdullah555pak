"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import type { ReportIssue } from "@/lib/report-types";
import { IssueDetailHeader } from "@/components/issue/IssueDetailHeader";
import { IssueExplanation } from "@/components/issue/IssueExplanation";
import { WhyItMatters } from "@/components/issue/WhyItMatters";
import { EvidencePanel } from "@/components/issue/EvidencePanel";
import { FixGuide } from "@/components/issue/FixGuide";
import { DifficultyBadge } from "@/components/issue/DifficultyBadge";
import { ImpactBadge } from "@/components/issue/ImpactBadge";
import { ReadyToVerify } from "@/components/issue/ReadyToVerify";
import { NextActionPanel } from "@/components/issue/NextActionPanel";

/**
 * No real issue store exists yet - there is nowhere to actually look an
 * issue id up. This always honestly returns null rather than inventing
 * a match; it exists as a real function (not a hardcoded branch) so the
 * page's "not found" path runs through real logic that a future backend
 * lookup can replace without changing anything below it.
 */
function findIssueById(_url: string, _id: string): ReportIssue | null {
  return null;
}

function hasUsableIssueData(issue: ReportIssue): boolean {
  return issue.title.trim().length > 0 && issue.shortExplanation.trim().length > 0;
}

function Breadcrumb({ reportHref }: { reportHref: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
      <Link
        href="/report"
        className="rounded font-semibold text-accent-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Report
      </Link>
      <span aria-hidden="true" className="text-muted">
        /
      </span>
      <Link
        href={reportHref}
        className="rounded font-semibold text-accent-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Problems
      </Link>
      <span aria-hidden="true" className="text-muted">
        /
      </span>
      <span className="text-ink-soft">Issue</span>
    </nav>
  );
}

function IssueDetailPageContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const issueId = searchParams.get("id");
  const reportHref = `/report?url=${encodeURIComponent(url)}&section=problems`;
  const scanHref = `/scan?url=${encodeURIComponent(url)}`;

  if (!url) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <EmptyState
          title="Scan required"
          description="Analyze a website first to see details about a specific issue."
          action={<ButtonLink href="/">Analyze a website</ButtonLink>}
        />
      </div>
    );
  }

  if (!issueId) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Breadcrumb reportHref={reportHref} />
        <EmptyState
          title="Report unavailable"
          description="We don't have a report to show issue details from yet."
          action={<ButtonLink href={scanHref}>Analyze this website</ButtonLink>}
        />
      </div>
    );
  }

  const issue = findIssueById(url, issueId);

  if (!issue) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Breadcrumb reportHref={reportHref} />
        <EmptyState
          title="Issue not found"
          description="We couldn't find this issue. It may have already been resolved, or the link may be out of date."
          action={<ButtonLink href={reportHref}>Back to problems</ButtonLink>}
        />
      </div>
    );
  }

  if (!hasUsableIssueData(issue)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Breadcrumb reportHref={reportHref} />
        <EmptyState
          title="Issue data unavailable"
          description="We found this issue, but couldn't load its full details."
          action={<ButtonLink href={reportHref}>Back to problems</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Breadcrumb reportHref={reportHref} />
      <IssueDetailHeader issue={issue} />

      <div className="mt-6 flex flex-col gap-8">
        <IssueExplanation issue={issue} />
        <WhyItMatters issue={issue} />

        <section aria-labelledby="issue-evidence-heading">
          <h2 id="issue-evidence-heading" className="text-lg font-semibold text-ink">
            Evidence
          </h2>
          <div className="mt-2">
            <EvidencePanel evidence={issue.evidence} />
          </div>
        </section>

        <section aria-labelledby="issue-glance-heading">
          <h2 id="issue-glance-heading" className="text-lg font-semibold text-ink">
            At a glance
          </h2>
          <div className="mt-2 flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-semibold text-muted">Difficulty</p>
              <div className="mt-1">
                <DifficultyBadge difficulty={issue.difficulty} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Expected impact</p>
              <div className="mt-1">
                <ImpactBadge impact={issue.expectedImpact} />
              </div>
            </div>
          </div>
        </section>

        <FixGuide fixSteps={issue.fixSteps} />

        <ReadyToVerify url={url} />

        <NextActionPanel reportHref={reportHref} scanHref={scanHref} />
      </div>
    </div>
  );
}

export default function IssueDetailPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<p className="p-8 text-center text-sm text-muted">Loading…</p>}>
          <IssueDetailPageContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
