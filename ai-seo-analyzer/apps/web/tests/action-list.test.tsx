import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionList } from "@/components/action-plan/ActionList";
import type { ActionPlanItem } from "@/lib/action-plan-types";

const ACTION: ActionPlanItem = {
  id: "action-1",
  order: 1,
  status: "not_started",
  title: "Example action",
  shortExplanation: "Example explanation.",
  whyItMatters: "Example reason.",
  whyItMattersDetail: null,
  severity: "medium",
  category: "content",
  affectedPages: 4,
  source: null,
  evidence: null,
  confidence: "estimated",
  fixAvailable: false,
  fixSteps: null,
  difficulty: null,
  expectedImpact: null,
  detectedAt: null,
  verification: { status: "not_verified", lastCheckedAt: null },
  relatedIssueIds: [],
};

describe("ActionList (Category 02 Step 07, Task 2)", () => {
  it("shows the honest 'no action plan yet' state (never 'no problems found') when nothing has ever been analyzed", () => {
    render(<ActionList actions={[]} totalCount={0} />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/your action plan will appear here after your website has been analyzed/i);
    expect(text).not.toMatch(/no problems found/i);
  });

  it("shows a distinct 'no matches' message when real actions exist but the current filter matches none", () => {
    render(<ActionList actions={[]} totalCount={5} />);
    expect(screen.getByText(/no actions match your filters/i)).toBeInTheDocument();
  });

  it("groups real actions under their category heading and fires the fix-guide action", () => {
    const onViewFixGuide = vi.fn();
    render(<ActionList actions={[ACTION]} totalCount={1} onViewFixGuide={onViewFixGuide} />);

    expect(screen.getByText("Content & On-Page SEO")).toBeInTheDocument();
    expect(screen.getByText("Example action")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view fix guide/i }));
    expect(onViewFixGuide).toHaveBeenCalledWith("action-1");
  });
});
