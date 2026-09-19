import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionCard } from "@/components/action-plan/ActionCard";
import type { ActionPlanItem } from "@/lib/action-plan-types";

const ACTION: ActionPlanItem = {
  id: "action-1",
  order: 3,
  status: "in_progress",
  title: "Missing meta description",
  shortExplanation: "This page has no meta description.",
  whyItMatters: "Search engines may show a poor snippet.",
  whyItMattersDetail: null,
  severity: "high",
  category: "content",
  affectedPages: 6,
  source: null,
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

describe("ActionCard (Category 02 Step 07, Task 5)", () => {
  it("shows order, title, priority, status, confidence, affected pages, difficulty, and impact - each with a text label", () => {
    render(<ActionCard action={ACTION} />);

    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText("Missing meta description")).toBeInTheDocument();
    // "High" appears twice: severity and expected impact are both "high".
    expect(screen.getAllByText("High")).toHaveLength(2);
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText(/affects 6 pages/i)).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("fires the View Fix Guide action with the action's id", () => {
    const onViewFixGuide = vi.fn();
    render(<ActionCard action={ACTION} onViewFixGuide={onViewFixGuide} />);
    fireEvent.click(screen.getByRole("button", { name: /view fix guide/i }));
    expect(onViewFixGuide).toHaveBeenCalledWith("action-1");
  });

  it("shows 'not available yet' instead of inventing an affected page count", () => {
    render(<ActionCard action={{ ...ACTION, affectedPages: null }} />);
    expect(screen.getByText(/affected pages: not available yet/i)).toBeInTheDocument();
  });
});
