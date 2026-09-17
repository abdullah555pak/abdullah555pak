import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScanProgress, DEFAULT_SCAN_STAGES } from "@/components/scan/ScanProgress";

describe("ScanProgress", () => {
  it("lists all default stages in plain language", () => {
    render(<ScanProgress currentIndex={-1} />);
    for (const stage of DEFAULT_SCAN_STAGES) {
      expect(screen.getByText(stage.label)).toBeInTheDocument();
    }
  });

  it("marks stages before currentIndex as done and announces the active stage for screen readers", () => {
    render(<ScanProgress currentIndex={2} targetLabel="example.com" />);

    // Two stages done -> two checkmark icons rendered.
    const checkmarks = document.querySelectorAll("svg path[d^='M5 13l4 4L19 7']");
    expect(checkmarks).toHaveLength(2);

    expect(screen.getByRole("status")).toHaveTextContent(
      /step 3 of 6: checking technical seo, in progress/i
    );
    expect(screen.getByText(/scanning/i)).toHaveTextContent("example.com");
  });

  it("announces completion once every stage is done", () => {
    render(<ScanProgress currentIndex={DEFAULT_SCAN_STAGES.length} />);
    expect(screen.getByRole("status")).toHaveTextContent(/scan complete/i);
  });

  it("never claims a real scan is running - this is a presentational component only", () => {
    render(<ScanProgress currentIndex={1} />);
    expect(screen.queryByText(/\d+%\s*complete of your real scan/i)).not.toBeInTheDocument();
  });
});
