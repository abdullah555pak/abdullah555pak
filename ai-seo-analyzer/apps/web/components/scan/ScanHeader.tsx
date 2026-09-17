"use client";

import type { ScanPhase } from "@/lib/scan-machine";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { ScanStatus } from "./ScanStatus";

export interface ScanHeaderProps {
  url: string;
  phase: ScanPhase;
  /** Simple, beginner-friendly sentence describing what's happening right now. */
  explanation: string;
}

/**
 * The top of the scan screen: what site is being checked, its address,
 * the current status, and one plain sentence of context (Task 1). Takes
 * focus once on mount so screen-reader/keyboard users land here right
 * after leaving the homepage.
 */
export function ScanHeader({ url, phase, explanation }: ScanHeaderProps) {
  const headingRef = useAutoFocus<HTMLHeadingElement>();

  return (
    <div className="text-center">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-2xl font-semibold text-ink outline-none sm:text-3xl"
      >
        Analyzing your website
      </h1>
      <p className="mt-1 break-all text-sm font-semibold text-ink-soft">{url}</p>
      <div className="mt-3">
        <ScanStatus phase={phase} />
      </div>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{explanation}</p>
    </div>
  );
}
