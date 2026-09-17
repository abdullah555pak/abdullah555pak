import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScanError } from "@/components/scan/ScanError";

describe("ScanError", () => {
  it("shows the given safe message as an accessible alert, never a stack trace", () => {
    render(<ScanError variant="failed" message="Website could not be reached." />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/analysis failed/i);
    expect(alert).toHaveTextContent("Website could not be reached.");
    expect(alert.textContent).not.toMatch(/traceback|exception|at\s+\w+\.\w+\(/i);
  });

  it("distinguishes the honest 'not available yet' outcome from a real failure", () => {
    render(<ScanError variant="unavailable" message="This feature isn't built yet." />);
    expect(screen.getByRole("heading")).toHaveTextContent(/isn't available yet/i);
  });

  it("always offers Back to Home, and Try Again only when a retry handler is given", () => {
    const { rerender } = render(<ScanError variant="failed" message="Something went wrong." />);
    expect(screen.getByRole("link", { name: /back to home/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();

    const onTryAgain = vi.fn();
    rerender(<ScanError variant="failed" message="Something went wrong." onTryAgain={onTryAgain} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onTryAgain).toHaveBeenCalledOnce();
  });

  it("moves focus to the heading on mount", () => {
    render(<ScanError variant="failed" message="Something went wrong." />);
    expect(screen.getByRole("heading")).toHaveFocus();
  });
});
