import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReportNavigation } from "@/components/report/ReportNavigation";

const ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "problems", label: "Problems" },
  { id: "technical-seo", label: "Technical SEO" },
];

describe("ReportNavigation (Task 8: category navigation)", () => {
  it("marks the active section with aria-current in the desktop sidebar", () => {
    render(<ReportNavigation items={ITEMS} activeId="problems" onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Problems" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("calls onSelect when a sidebar item is clicked", () => {
    const onSelect = vi.fn();
    render(<ReportNavigation items={ITEMS} activeId="overview" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Technical SEO" }));
    expect(onSelect).toHaveBeenCalledWith("technical-seo");
  });

  it("also exposes every item in an accessible mobile dropdown that stays in sync", () => {
    const onSelect = vi.fn();
    render(<ReportNavigation items={ITEMS} activeId="overview" onSelect={onSelect} />);

    const select = screen.getByLabelText(/jump to report section/i) as HTMLSelectElement;
    expect(select.value).toBe("overview");

    fireEvent.change(select, { target: { value: "problems" } });
    expect(onSelect).toHaveBeenCalledWith("problems");
  });
});
