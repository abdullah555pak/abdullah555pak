"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";

export interface CancelScanDialogProps {
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * A safe confirmation step before actually cancelling (Task 6) - the
 * default focused action is "Keep Waiting", not the destructive one.
 * Escape dismisses without cancelling, same as clicking the backdrop.
 */
export function CancelScanDialog({ onConfirm, onDismiss }: CancelScanDialogProps) {
  const titleId = useId();
  const keepWaitingRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    keepWaitingRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4">
      <button
        type="button"
        aria-label="Close dialog without cancelling"
        onClick={onDismiss}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 text-center shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          Cancel this scan?
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Cancelling will stop the current analysis. You can start a new scan at any time.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button variant="secondary" onClick={onConfirm}>
            Cancel Scan
          </Button>
          <Button ref={keepWaitingRef} variant="primary" onClick={onDismiss}>
            Keep Waiting
          </Button>
        </div>
      </div>
    </div>
  );
}
