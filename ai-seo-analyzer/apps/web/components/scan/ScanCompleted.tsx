"use client";

import { useAutoFocus } from "@/hooks/useAutoFocus";
import { ButtonLink } from "@/components/ui/Button";

export interface ScanCompletedProps {
  url: string;
  /** Where the real report lives - a route that doesn't exist until the SEO engine does. */
  reportHref: string;
}

/**
 * Task 9's completion screen. Nothing here is reachable in production
 * yet - the backend never returns success - but the component is real,
 * tested, and ready for the day a report actually exists to link to.
 */
export function ScanCompleted({ url, reportHref }: ScanCompletedProps) {
  const headingRef = useAutoFocus<HTMLHeadingElement>();

  return (
    <div className="mx-auto max-w-md text-center">
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-good outline-none">
        Analysis Complete
      </h2>
      <p className="mt-1 break-all text-sm font-semibold text-ink-soft">{url}</p>
      <p className="mt-3 text-sm text-ink-soft">
        We&apos;ve finished checking the information available from this website.
      </p>
      <div className="mt-6">
        <ButtonLink href={reportHref}>View Report</ButtonLink>
      </div>
    </div>
  );
}
