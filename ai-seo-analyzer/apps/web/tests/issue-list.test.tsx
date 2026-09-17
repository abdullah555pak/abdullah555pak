import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IssueList } from "@/components/report/IssueList";
import type { ReportIssue } from "@/lib/report-types";

const ISSUE: ReportIssue = {
  id: "issue-1",
  title: "Example issue",
  shortExplanation: "Example explanation.",
  whyItMatters: "Example reason.",
  severity: "medium",
  category: "content",
  affectedPages: 4,
  evidence: null,
  confidence: "estimated",
  fixAvailable: false,
  howToFix: null,
  difficulty: null,
  expectedImpact: null,
  detectedAt: null,
};

describe("IssueList (Task 2 / Task 13)", () => {
  it("shows 'real scan data is not available yet' (never 'no issues found') when nothing has ever been analyzed", () => {
    render(<IssueList issues={[]} totalCount={0} />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/not available yet/i);
    expect(text).not.toMatch(/no issues found/i);
  });

  it("shows a distinct 'no matches' message when real issues exist but the current filter matches none", () => {
    render(<IssueList issues={[]} totalCount={5} />);
    expect(screen.getByText(/no issues match your filters/i)).toBeInTheDocument();
  });

  it("renders real issues with a working 'View issue' action", () => {
    const onView = vi.fn();
    render(<IssueList issues={[ISSUE]} totalCount={1} onView={onView} />);

    expect(screen.getByText("Example issue")).toBeInTheDocument();
    expect(screen.getByText(/affects 4 pages/i)).toBeInTheDocument();
    expect(screen.getByText(/fix guide not available yet/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view issue/i }));
    expect(onView).toHaveBeenCalledWith("issue-1");
  });
});
