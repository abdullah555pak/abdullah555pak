import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { IssueDetailHeader } from "@/components/issue/IssueDetailHeader";
import type { ReportIssue } from "@/lib/report-types";

const ISSUE: ReportIssue = {
  id: "issue-1",
  title: "Missing meta description",
  shortExplanation: "This page has no meta description.",
  whyItMatters: "Search engines may show a poor snippet.",
  whyItMattersDetail: null,
  severity: "high",
  category: "content",
  affectedPages: 6,
  source: "Meta description check",
  evidence: null,
  confidence: "verified",
  fixAvailable: true,
  fixSteps: null,
  difficulty: "easy",
  expectedImpact: "high",
  detectedAt: "2026-01-01",
  verification: { status: "not_verified", lastCheckedAt: null },
  relatedIssueIds: [],
};

describe("IssueDetailHeader (Category 02 Step 06, Task 1)", () => {
  it("shows the title, priority, confidence, explanation, affected pages, and source", () => {
    render(<IssueDetailHeader issue={ISSUE} />);

    expect(screen.getByRole("heading", { name: "Missing meta description" })).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("This page has no meta description.")).toBeInTheDocument();
    expect(screen.getByText(/affects 6 pages/i)).toBeInTheDocument();
    expect(screen.getByText(/meta description check/i)).toBeInTheDocument();
  });

  it("shows 'not available yet' instead of inventing an affected page count", () => {
    render(<IssueDetailHeader issue={{ ...ISSUE, affectedPages: null, source: null }} />);
    expect(screen.getByText(/affected pages: not available yet/i)).toBeInTheDocument();
  });
});
