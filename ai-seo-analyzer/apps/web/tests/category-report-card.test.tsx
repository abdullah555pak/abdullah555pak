import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryReportCard } from "@/components/report/CategoryReportCard";

describe("CategoryReportCard (Task 3)", () => {
  it("never implies a category has been analyzed when it hasn't", () => {
    render(
      <CategoryReportCard
        category={{
          id: "technical-seo",
          title: "Technical SEO",
          description: "Example description.",
          issueCount: null,
          confidence: "unavailable",
        }}
      />
    );

    expect(screen.getByText(/not analyzed yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/\d+ issues? found/i)).not.toBeInTheDocument();
  });

  it("shows a real issue count once one exists, and fires View details with the category id", () => {
    const onViewDetails = vi.fn();
    render(
      <CategoryReportCard
        category={{
          id: "performance",
          title: "Performance",
          description: "Example description.",
          issueCount: 3,
          confidence: "detected",
        }}
        onViewDetails={onViewDetails}
      />
    );

    expect(screen.getByText(/3 issues found/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /view details/i }));
    expect(onViewDetails).toHaveBeenCalledWith("performance");
  });
});
