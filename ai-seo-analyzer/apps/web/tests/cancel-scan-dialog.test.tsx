import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CancelScanDialog } from "@/components/scan/CancelScanDialog";

describe("CancelScanDialog", () => {
  it("warns that cancelling stops the analysis, and defaults focus to the safe 'Keep Waiting' option", () => {
    render(<CancelScanDialog onConfirm={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByRole("alertdialog")).toHaveTextContent(/cancel this scan/i);
    expect(screen.getByText(/cancelling will stop the current analysis/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keep waiting/i })).toHaveFocus();
  });

  it("calls onConfirm only when the destructive action is explicitly clicked", () => {
    const onConfirm = vi.fn();
    render(<CancelScanDialog onConfirm={onConfirm} onDismiss={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel scan$/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when Keep Waiting is clicked, or Escape is pressed, without cancelling", () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    render(<CancelScanDialog onConfirm={onConfirm} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /keep waiting/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});
