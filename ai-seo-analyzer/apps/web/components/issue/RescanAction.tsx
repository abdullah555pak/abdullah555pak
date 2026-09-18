import { ReScanButton } from "@/components/report/ReScanButton";

interface RescanActionProps {
  url: string;
}

/** Task 8: re-runs the real scan flow, with copy specific to checking a fix. */
export function RescanAction({ url }: RescanActionProps) {
  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
      <p className="text-sm text-ink-soft">Re-scan your website to check whether this issue is resolved.</p>
      <ReScanButton url={url} size="sm" />
    </div>
  );
}
