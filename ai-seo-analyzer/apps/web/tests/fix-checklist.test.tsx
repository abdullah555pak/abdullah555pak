import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FixChecklist } from "@/components/issue/FixChecklist";
import type { FixStepData } from "@/lib/report-types";

const STEPS: FixStepData[] = [
  {
    id: "step-1",
    title: "Add a meta description",
    description: "Write a one-sentence summary of the page.",
    helpText: "Keep it under 160 characters.",
    instructionType: "metadata",
    actionLabel: null,
    actionHref: null,
  },
  {
    id: "step-2",
    title: "Publish the change",
    description: "Save and publish your page.",
    helpText: null,
    instructionType: "cms",
    actionLabel: "Open your CMS",
    actionHref: "https://example.com/cms",
  },
];

describe("FixChecklist (Category 02 Step 06, Task 6)", () => {
  it("shows the honest 'Fix guide unavailable' state when there are no real steps", () => {
    render(<FixChecklist fixSteps={null} />);
    expect(screen.getByText(/fix guide unavailable/i)).toBeInTheDocument();
  });

  it("shows the same unavailable state for an empty list", () => {
    render(<FixChecklist fixSteps={[]} />);
    expect(screen.getByText(/fix guide unavailable/i)).toBeInTheDocument();
  });

  it("renders every step with its checkbox, title, description, help text, platform label, and action link", () => {
    render(<FixChecklist fixSteps={STEPS} />);

    expect(screen.getByText(/add a meta description/i)).toBeInTheDocument();
    expect(screen.getByText(/write a one-sentence summary/i)).toBeInTheDocument();
    expect(screen.getByText(/other cms/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open your cms/i })).toHaveAttribute(
      "href",
      "https://example.com/cms"
    );
    expect(screen.getByText("0 of 2 steps checked off")).toBeInTheDocument();
  });

  it("tracks completion state per step when checked", () => {
    render(<FixChecklist fixSteps={STEPS} />);
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText("1 of 2 steps checked off")).toBeInTheDocument();
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });
});
