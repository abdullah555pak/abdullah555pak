import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HealthSummary } from "@/components/report/HealthSummary";

describe("HealthSummary (Task 1B / Task 14: no misleading SEO score)", () => {
  it("never shows a fake score - shows a dash and an explicit 'will appear after analysis' message instead", () => {
    render(
      <HealthSummary
        data={{ overallScore: null, criticalCount: null, importantCount: null, improvementCount: null, confidence: "unavailable" }}
      />
    );

    // One dash for the score, one each for critical/important/improvement counts.
    expect(screen.getAllByText("—")).toHaveLength(4);
    expect(screen.getByText(/score will appear after analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/analysis data will appear here after a real scan/i)).toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*\/\s*100/)).not.toBeInTheDocument();
  });

  it("shows a real score and counts once they exist, with their confidence", () => {
    render(
      <HealthSummary
        data={{ overallScore: 74, criticalCount: 2, importantCount: 5, improvementCount: 8, confidence: "detected" }}
      />
    );

    expect(screen.getByText("74")).toBeInTheDocument();
    expect(screen.getByText("out of 100")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Detected")).toBeInTheDocument();
  });
});
