import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActionDetail } from "@/components/action-plan/ActionDetail";
import type { ActionPlanItem } from "@/lib/action-plan-types";

const ACTION: ActionPlanItem = {
  id: "action-1",
  order: 1,
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

describe("ActionDetail (Category 02 Step 07, Task 10)", () => {
  it("reuses the Step 06 issue-detail sections: what's wrong, why it matters, evidence, fix guide, verify", () => {
    render(
      <ActionDetail
        action={ACTION}
        url="example.com"
        actionPlanHref="/action-plan?url=example.com"
        scanHref="/scan?url=example.com"
      />
    );

    expect(screen.getByRole("heading", { name: "Missing meta description" })).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText(/what is the problem\?/i)).toBeInTheDocument();
    expect(screen.getByText(/why does it matter\?/i)).toBeInTheDocument();
    expect(screen.getByText(/evidence unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/fix guide unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /i fixed this/i })).toBeInTheDocument();
    expect(screen.getByText(/what should i do next/i)).toBeInTheDocument();
  });
});
