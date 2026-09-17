import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScanProgress } from "@/components/scan/ScanProgress";
import { initialStageStates, SCAN_STAGE_DEFINITIONS, type ScanStageState } from "@/lib/scan-stages";

function withStatus(overrides: Record<number, ScanStageState["status"]>): ScanStageState[] {
  return initialStageStates().map((stage, index) => ({
    ...stage,
    status: overrides[index] ?? stage.status,
  }));
}

describe("ScanProgress", () => {
  it("lists every stage with its plain-language description", () => {
    render(<ScanProgress stages={initialStageStates()} />);
    for (const stage of SCAN_STAGE_DEFINITIONS) {
      expect(screen.getByText(stage.label)).toBeInTheDocument();
      expect(screen.getByText(stage.description)).toBeInTheDocument();
    }
  });

  it("shows an indeterminate progress bar when nothing has finished yet", () => {
    render(<ScanProgress stages={initialStageStates()} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
  });

  it("shows a real, calculated percentage once stages have finished - never a fabricated one", () => {
    const stages = withStatus({ 0: "completed", 1: "completed", 2: "running" });
    render(<ScanProgress stages={stages} />);
    const bar = screen.getByRole("progressbar");
    // 2 of 9 stages finished (completed/failed/skipped) = 22%.
    expect(bar).toHaveAttribute("aria-valuenow", "22");
  });

  it("announces the active stage for screen readers", () => {
    const stages = withStatus({ 2: "running" });
    render(<ScanProgress stages={stages} />);
    expect(screen.getByRole("status")).toHaveTextContent(/checking technical seo, in progress/i);
  });

  it("excludes not_available stages from the progress denominator", () => {
    const stages = withStatus({ 0: "completed", 8: "not_available" });
    render(<ScanProgress stages={stages} />);
    // 1 of 8 trackable stages finished = 13%.
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "13");
  });

  it("never claims a stage is running or completed unless it's told to", () => {
    render(<ScanProgress stages={initialStageStates()} />);
    expect(screen.queryByRole("status")).toHaveTextContent(/ready/i);
  });
});
