import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportHeader } from "@/components/report/ReportHeader";

describe("ReportHeader (Task 1A)", () => {
  it("shows the website URL, an honest scan status, a re-scan action, and a way back home", () => {
    render(<ReportHeader meta={{ url: "example.com", scannedAt: null, status: "not_found" }} />);

    expect(screen.getByRole("heading", { name: "example.com" })).toBeInTheDocument();
    expect(screen.getByText(/not scanned yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");

    const rescan = screen.getByRole("link", { name: /re-scan/i });
    expect(rescan).toHaveAttribute("href", "/scan?url=example.com");
  });

  it("shows the real scan date once one exists, instead of a placeholder", () => {
    render(
      <ReportHeader meta={{ url: "example.com", scannedAt: "2026-01-01 10:00", status: "ready" }} />
    );
    expect(screen.getByText(/last scanned 2026-01-01 10:00/i)).toBeInTheDocument();
    expect(screen.getByText(/scan complete/i)).toBeInTheDocument();
  });
});
