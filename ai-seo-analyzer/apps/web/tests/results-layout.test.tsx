import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsLayout } from "@/components/results/ResultsLayout";

const EXPECTED_SECTIONS = [
  "Overview",
  "Problems",
  "Technical SEO",
  "Performance",
  "Content",
  "Ads & monetization",
  "Traffic & audience",
  "Keywords",
  "Backlinks",
  "Competitors",
  "Action plan",
];

describe("ResultsLayout", () => {
  it("renders every required section", () => {
    render(<ResultsLayout />);
    for (const section of EXPECTED_SECTIONS) {
      expect(screen.getByRole("heading", { name: section })).toBeInTheDocument();
    }
  });

  it("marks every data section as not implemented instead of inventing values", () => {
    render(<ResultsLayout />);
    const notImplemented = screen.getAllByText(/not implemented yet/i);
    // One per section below Overview.
    expect(notImplemented.length).toBe(EXPECTED_SECTIONS.length - 1);
  });

  it("never shows a fake score, percentage, or numeric finding count", () => {
    render(<ResultsLayout />);
    expect(screen.queryByText(/\d+\s*\/\s*100/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^\d+%$/)).not.toBeInTheDocument();
    // The overview placeholder is an explicit dash, not a number.
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
