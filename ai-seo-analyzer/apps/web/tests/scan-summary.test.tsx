import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScanSummary } from "@/components/scan/ScanSummary";

describe("ScanSummary", () => {
  it("shows a dash instead of a fabricated number when page counts aren't available", () => {
    render(<ScanSummary />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(3); // pages found / checked / left
  });

  it("shows real numbers once they're provided", () => {
    render(<ScanSummary pagesDiscovered={12} pagesScanned={5} pagesRemaining={7} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("keeps crawl limit and scan mode behind a collapsed 'Advanced options' section", () => {
    render(<ScanSummary crawlLimit={50} scanMode="standard" />);

    const trigger = screen.getByText(/advanced options/i);
    const details = trigger.closest("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);

    fireEvent.click(trigger);

    expect(details.open).toBe(true);
    expect(screen.getByText("standard")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });
});
