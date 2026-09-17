"use client";

import { useAutoFocus } from "@/hooks/useAutoFocus";
import { Button, ButtonLink } from "@/components/ui/Button";

export type ScanErrorVariant = "failed" | "unavailable";

export interface ScanErrorProps {
  variant: ScanErrorVariant;
  /** The safe, plain-language message from the API - never a raw exception. */
  message: string;
  onTryAgain?: () => void;
}

const COPY: Record<ScanErrorVariant, { title: string; tone: string }> = {
  failed: { title: "Analysis failed", tone: "text-critical" },
  unavailable: { title: "This part of Sitewell isn't available yet", tone: "text-gold" },
};

/**
 * Covers both a genuine failure and the current honest reality that the
 * analysis engine doesn't exist yet - two different situations (Task 14
 * keeps them as separate states), same visual treatment. Never renders a
 * stack trace or raw exception - only the message it's given, which the
 * API already guarantees is safe.
 */
export function ScanError({ variant, message, onTryAgain }: ScanErrorProps) {
  const headingRef = useAutoFocus<HTMLHeadingElement>();
  const { title, tone } = COPY[variant];

  return (
    <div role="alert" className="mx-auto max-w-md text-center">
      <h2 ref={headingRef} tabIndex={-1} className={`text-xl font-semibold outline-none ${tone}`}>
        {title}
      </h2>
      <p className="mt-2 text-sm text-ink-soft">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onTryAgain && (
          <Button variant="primary" onClick={onTryAgain}>
            Try Again
          </Button>
        )}
        <ButtonLink href="/" variant="secondary">
          Back to Home
        </ButtonLink>
      </div>
    </div>
  );
}
