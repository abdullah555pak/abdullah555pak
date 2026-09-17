"use client";

import { useAutoFocus } from "@/hooks/useAutoFocus";
import { ButtonLink } from "@/components/ui/Button";

export interface PartialScanNoticeProps {
  url: string;
  /** Plain-language list of what couldn't be checked and why. */
  limitations: string[];
  reportHref: string;
}

/**
 * Task 8: a partial scan is never discarded or hidden behind a plain
 * failure - it's shown as its own honest outcome, with exactly what
 * came back short. Not reachable in production yet (see ScanCompleted).
 */
export function PartialScanNotice({ url, limitations, reportHref }: PartialScanNoticeProps) {
  const headingRef = useAutoFocus<HTMLHeadingElement>();

  return (
    <div className="mx-auto max-w-md text-center">
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-warn outline-none">
        Analysis completed with limitations
      </h2>
      <p className="mt-1 break-all text-sm font-semibold text-ink-soft">{url}</p>
      <p className="mt-3 text-sm text-ink-soft">
        We finished checking most of this website, but some areas couldn&apos;t be analyzed:
      </p>
      <ul className="mx-auto mt-3 flex max-w-xs flex-col gap-1.5 text-left text-sm text-ink-soft">
        {limitations.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warn" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <ButtonLink href={reportHref}>View Report</ButtonLink>
      </div>
    </div>
  );
}
