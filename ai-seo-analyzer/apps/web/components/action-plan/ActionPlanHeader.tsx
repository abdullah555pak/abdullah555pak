import Link from "next/link";
import { ReScanButton } from "@/components/report/ReScanButton";

interface ActionPlanHeaderProps {
  url: string;
  /** ISO timestamp of the last completed scan, or null - never a placeholder date. */
  lastScannedAt: string | null;
}

/** Task 2: page title, site, last-scan placeholder, and the real re-scan action. */
export function ActionPlanHeader({ url, lastScannedAt }: ActionPlanHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link href={`/report?url=${encodeURIComponent(url)}`} className="text-xs font-semibold text-accent-strong hover:underline">
          ← Back to Report
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">SEO Action Plan</h1>
        <p className="mt-1 break-all text-sm font-semibold text-ink-soft">{url}</p>
        <p className="mt-1 text-sm text-muted">
          {lastScannedAt ? `Last scanned ${lastScannedAt}` : "Not scanned yet"}
        </p>
      </div>
      <div className="shrink-0">
        <ReScanButton url={url} />
      </div>
    </div>
  );
}
