import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IssueDetailPanel } from "@/components/report/IssueDetailPanel";
import type { ReportIssue } from "@/lib/report-types";

const ISSUE: ReportIssue = {
  id: "issue-1",
  title: "Example issue title",
  shortExplanation: "Example: what is wrong.",
  whyItMatters: "Example: why it matters.",
  severity: "high",
  category: "technical-seo",
  affectedPages: 6,
  evidence: "Example raw evidence line.",
  confidence: "verified",
  fixAvailable: true,
  howToFix: ["Example step 1.", "Example step 2."],
  difficulty: "medium",
  expectedImpact: "high",
  detectedAt: "2026-01-01",
};

describe("IssueDetailPanel (Task 6)", () => {
  it("shows the honest unavailable state instead of inventing an issue when none is given", () => {
    render(<IssueDetailPanel issue={null} scanHref="/scan?url=example.com" />);
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });

  it("shows every required field for a real issue: what's wrong, why it matters, affected pages, fix steps, difficulty, impact, confidence", () => {
    render(<IssueDetailPanel issue={ISSUE} scanHref="/scan?url=example.com" />);

    expect(screen.getByRole("heading", { name: "Example issue title" })).toBeInTheDocument();
    expect(screen.getByText(/what is wrong\?/i)).toBeInTheDocument();
    expect(screen.getByText("Example: what is wrong.")).toBeInTheDocument();
    expect(screen.getByText(/why does it matter\?/i)).toBeInTheDocument();
    expect(screen.getByText("Example: why it matters.")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("Example step 1.")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText(/expected impact/i).closest("div")).toHaveTextContent("High");
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });

  it("keeps evidence collapsed by default and reveals it on click", () => {
    render(<IssueDetailPanel issue={ISSUE} />);
    expect(screen.queryByText("Example raw evidence line.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show technical details/i }));
    expect(screen.getByText("Example raw evidence line.")).toBeInTheDocument();
  });

  it("disables the fix guide button and explains why when no fix guide exists yet", () => {
    render(<IssueDetailPanel issue={{ ...ISSUE, fixAvailable: false }} />);
    expect(screen.getByRole("button", { name: /see complete fix guide/i })).toBeDisabled();
    expect(screen.getByText(/fix guide for this issue isn't available yet/i)).toBeInTheDocument();
  });

  it("offers a re-scan-after-fixing link when a scan href is given", () => {
    render(<IssueDetailPanel issue={ISSUE} scanHref="/scan?url=example.com" />);
    expect(screen.getByRole("link", { name: /re-scan after fixing/i })).toHaveAttribute(
      "href",
      "/scan?url=example.com"
    );
  });
});
