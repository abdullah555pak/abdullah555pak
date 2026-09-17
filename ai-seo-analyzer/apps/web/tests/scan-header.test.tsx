import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScanHeader } from "@/components/scan/ScanHeader";

describe("ScanHeader", () => {
  it("shows the website being analyzed, its URL, status, and a plain-language explanation", () => {
    render(
      <ScanHeader url="example.com" phase="starting" explanation="We're getting things ready." />
    );

    expect(screen.getByRole("heading", { name: /analyzing your website/i })).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText(/starting your scan/i)).toBeInTheDocument();
    expect(screen.getByText("We're getting things ready.")).toBeInTheDocument();
  });

  it("moves focus to the heading on mount, for keyboard/screen-reader users arriving from the homepage", () => {
    render(<ScanHeader url="example.com" phase="starting" explanation="Explanation." />);
    expect(screen.getByRole("heading", { name: /analyzing your website/i })).toHaveFocus();
  });

  it("never shows a fake percentage or score itself - that's ScanProgress's job, driven by real data", () => {
    render(<ScanHeader url="example.com" phase="scanning" explanation="Explanation." />);
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*\/\s*100/)).not.toBeInTheDocument();
  });
});
