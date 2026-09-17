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
import { IssueCard } from "@/components/results/IssueCard";
import { ResultsLayout } from "@/components/results/ResultsLayout";

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

        <SectionHeader title="Issue card" />
        <p className="mb-3 text-xs text-muted">
          Template content below (not a real SEO finding), showing one example per priority
          level.
        </p>
        <Card className="divide-y divide-border p-0">
          <div className="px-5">
            {PRIORITIES.map((priority, index) => (
              <IssueCard
                key={priority}
                title="Issue title goes here"
                priority={priority}
                confidence={CONFIDENCES[index]}
                whyItMatters="Explanation of why this issue matters goes here."
                evidence="Example technical detail text goes here."
                fixSteps={["Step 1 goes here.", "Step 2 goes here.", "Step 3 goes here."]}
                verifyMethod="Explanation of how to confirm the fix worked goes here."
              />
            ))}
          </div>
        </Card>

        <SectionHeader title="Results page structure" />
        <p className="mb-3 text-xs text-muted">
          Every section below is intentionally empty — this is the honest, current state, not a
          demo of hidden content.
        </p>
        <ResultsLayout />
      </main>
      <Footer />
    </div>
  );
}
