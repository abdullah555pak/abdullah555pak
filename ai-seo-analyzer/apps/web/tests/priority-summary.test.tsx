import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrioritySummary } from "@/components/report/PrioritySummary";
import type { ReportIssue } from "@/lib/report-types";

const ISSUE: ReportIssue = {
  id: "issue-1",
  title: "Example issue",
  shortExplanation: "Example explanation.",
  whyItMatters: "Example reason this matters.",
  whyItMattersDetail: null,
  severity: "critical",
  category: "technical-seo",
  affectedPages: 3,
  source: null,
  evidence: [
    {
      confidence: "detected",
      url: "https://example.com",
      htmlElement: null,
      detectedValue: null,
      expectedValue: null,
      technicalDetails: "Example evidence.",
      screenshotUrl: null,
    },
  ],
  confidence: "detected",
  fixAvailable: true,
  fixSteps: null,
  difficulty: null,
  expectedImpact: null,
  detectedAt: "2026-01-01",
  verification: { status: "not_verified", lastCheckedAt: null },
  relatedIssueIds: [],
};

describe("PrioritySummary ('What should I fix first?')", () => {
  it("shows the honest unavailable state when there is nothing to prioritize yet", () => {
    render(<PrioritySummary topIssues={[]} />);
    expect(screen.getByText(/what should i fix first/i)).toBeInTheDocument();
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });

  it("renders each future item's title, why-it-matters, priority, and a working fix action", () => {
    const onSeeHowToFix = vi.fn();
    render(<PrioritySummary topIssues={[ISSUE]} onSeeHowToFix={onSeeHowToFix} />);

    expect(screen.getByText("Example issue")).toBeInTheDocument();
    expect(screen.getByText(/example reason this matters/i)).toBeInTheDocument();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /see how to fix/i }));
    expect(onSeeHowToFix).toHaveBeenCalledWith("issue-1");
  });
});
