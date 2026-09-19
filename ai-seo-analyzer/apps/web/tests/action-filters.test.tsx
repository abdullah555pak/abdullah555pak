import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionFilters } from "@/components/action-plan/ActionFilters";
import { ActionSearch } from "@/components/action-plan/ActionSearch";

describe("ActionFilters (Category 02 Step 07, Tasks 7-8)", () => {
  it("renders a status pill group and a category dropdown, both wired", () => {
    const onCategoryChange = vi.fn();
    const onStatusChange = vi.fn();
    render(
      <ActionFilters category="all" onCategoryChange={onCategoryChange} status="all" onStatusChange={onStatusChange} />
    );

    expect(screen.getByRole("group", { name: /filter actions by status/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Verified" }));
    expect(onStatusChange).toHaveBeenCalledWith("verified");

    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "performance" } });
    expect(onCategoryChange).toHaveBeenCalledWith("performance");
  });

  it("marks the active status pill with aria-pressed", () => {
    render(<ActionFilters category="all" onCategoryChange={vi.fn()} status="in_progress" onStatusChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "In progress" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("ActionSearch (Category 02 Step 07, Task 9)", () => {
  it("is labeled and reports changes", () => {
    const onChange = vi.fn();
    render(<ActionSearch value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/search actions/i), { target: { value: "meta" } });
    expect(onChange).toHaveBeenCalledWith("meta");
  });
});
