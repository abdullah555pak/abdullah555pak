import { Disclosure } from "@/components/ui/Disclosure";

export interface ScanSummaryProps {
  pagesDiscovered?: number;
  pagesScanned?: number;
  pagesRemaining?: number;
  crawlLimit?: number;
  scanMode?: "quick" | "standard" | "deep";
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-3 py-2.5">
      <span className="font-mono text-lg font-bold text-ink">{value ?? "—"}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

/**
 * Task 5: designed for large sites (page counts, crawl limit, scan
 * mode) without exposing raw technical controls to beginners - those
 * live behind "Advanced options" instead. Every stat shows "—" rather
 * than a fabricated number until a real crawler reports one.
 */
export function ScanSummary({
  pagesDiscovered,
  pagesScanned,
  pagesRemaining,
  crawlLimit,
  scanMode,
}: ScanSummaryProps) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Pages found" value={pagesDiscovered} />
        <Stat label="Pages checked" value={pagesScanned} />
        <Stat label="Pages left" value={pagesRemaining} />
      </div>

      <div className="mt-3">
        <Disclosure summary="Advanced options">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Scan mode</dt>
              <dd className="font-medium text-ink">{scanMode ?? "Not set yet"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Page limit for this scan</dt>
              <dd className="font-medium text-ink">{crawlLimit ?? "Not set yet"}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted">
            These options aren&apos;t adjustable yet — they&apos;ll become editable once larger-site
            scanning is built.
          </p>
        </Disclosure>
      </div>
    </div>
  );
}
