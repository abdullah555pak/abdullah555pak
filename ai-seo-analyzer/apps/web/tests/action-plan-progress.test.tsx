import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActionPlanProgress } from "@/components/action-plan/ActionPlanProgress";

describe("ActionPlanProgress (Category 02 Step 07, Task 11)", () => {
  it("never shows a fake percentage - shows the honest placeholder instead", () => {
    render(
      <ActionPlanProgress data={{ completedCount: null, remainingCount: null, needingVerificationCount: null }} />
    );
    expect(screen.getByText(/progress will appear after your website has been analyzed/i)).toBeInTheDocument();
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/%/);
  });

  it("shows real counts once real data exists, without the placeholder sentence", () => {
    render(<ActionPlanProgress data={{ completedCount: 2, remainingCount: 5, needingVerificationCount: 1 }} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText(/progress will appear after/i)).not.toBeInTheDocument();
  });
});
