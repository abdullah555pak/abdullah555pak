import Link from "next/link";
import type { ReportMeta } from "@/lib/report-types";
import { ReScanButton } from "./ReScanButton";

const STATUS_LABELS: Record<ReportMeta["status"], string> = {
  loading: "Loading…",
  not_found: "Not scanned yet",
  processing: "Scan in progress",
  partial: "Completed with limitations",
  failed: "Scan failed",
  ready: "Scan complete",
};

interface ReportHeaderProps {
  meta: ReportMeta;
}

/** Task 1A: the report's top bar - what site this is, when it was last checked, and the two actions available everywhere. */
export function ReportHeader({ meta }: ReportHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link href="/" className="text-xs font-semibold text-accent-strong hover:underline">
          ← Back to Home
        </Link>
        <h1 className="mt-1 break-all font-display text-xl font-semibold text-ink sm:text-2xl">
          {meta.url}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {meta.scannedAt && `Last scanned ${meta.scannedAt} · `}
          <span className="font-semibold text-ink-soft">{STATUS_LABELS[meta.status]}</span>
        </p>
      </div>
      <div className="shrink-0">
        <ReScanButton url={meta.url} />
      </div>
    </div>
  );
}
