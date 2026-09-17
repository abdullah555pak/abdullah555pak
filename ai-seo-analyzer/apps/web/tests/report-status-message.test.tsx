import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportStatusMessage } from "@/components/report/ReportStatusMessage";

describe("ReportStatusMessage (Task 13: loading/empty/error states)", () => {
  it("never says 'no issues found' for the unavailable state - only that real data isn't available yet", () => {
    render(<ReportStatusMessage kind="unavailable" />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/no issues found/i);
    expect(text).toMatch(/not available yet/i);
  });

  it("distinguishes 'no matches for your filters' from the unavailable state", () => {
    render(<ReportStatusMessage kind="no_matches" />);
    expect(screen.getByText(/no issues match your filters/i)).toBeInTheDocument();
  });

  it("offers a way to scan when a report doesn't exist yet", () => {
    render(<ReportStatusMessage kind="not_found" scanHref="/scan?url=example.com" />);
    expect(screen.getByText(/no report available/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /analyze this website/i })).toHaveAttribute(
      "href",
      "/scan?url=example.com"
    );
  });

  it("shows a loading state for 'loading' and 'processing'", () => {
    const { rerender } = render(<ReportStatusMessage kind="loading" />);
    expect(screen.getByRole("status")).toHaveTextContent(/loading report/i);

    rerender(<ReportStatusMessage kind="processing" />);
    expect(screen.getByRole("status")).toHaveTextContent(/still being put together/i);
  });

  it("shows a distinct message for a partial report and a failed one", () => {
    const { rerender } = render(<ReportStatusMessage kind="partial" />);
    expect(screen.getByText(/partially available/i)).toBeInTheDocument();

    rerender(<ReportStatusMessage kind="failed" />);
    expect(screen.getByRole("alert")).toHaveTextContent(/report failed/i);
  });
});
