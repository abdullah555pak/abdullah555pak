import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScanCompleted } from "@/components/scan/ScanCompleted";

describe("ScanCompleted", () => {
  it("shows the completion message, URL, and a View Report link - no score or findings", () => {
    render(<ScanCompleted url="example.com" reportHref="/report?url=example.com" />);

    expect(screen.getByRole("heading", { name: /analysis complete/i })).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(
      screen.getByText(/we've finished checking the information available from this website/i)
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /view report/i });
    expect(link).toHaveAttribute("href", "/report?url=example.com");

    expect(screen.queryByText(/\d+\s*\/\s*100/)).not.toBeInTheDocument();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
  });

  it("moves focus to the heading on mount", () => {
    render(<ScanCompleted url="example.com" reportHref="/report" />);
    expect(screen.getByRole("heading")).toHaveFocus();
  });
});
