"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { useScan } from "@/hooks/useScan";
import { ScanHeader } from "@/components/scan/ScanHeader";
import { ScanProgress } from "@/components/scan/ScanProgress";
import { ScanError } from "@/components/scan/ScanError";
import { ScanCompleted } from "@/components/scan/ScanCompleted";
import { PartialScanNotice } from "@/components/scan/PartialScanNotice";
import { CancelScanDialog } from "@/components/scan/CancelScanDialog";

const IN_PROGRESS_EXPLANATION =
  "We're checking that this website address is safe to analyze. This usually takes just a few seconds.";

function ScanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const { state, start, requestCancel, confirmCancel, dismissCancel } = useScan();

  useEffect(() => {
    if (url) start(url);
    // Runs once per distinct URL - start() itself is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (!url) {
    return (
      <ScanError
        variant="failed"
        message="No website address was given to scan. Start again from the homepage."
      />
    );
  }

  const inProgress = state.phase === "starting" || state.phase === "scanning" || state.phase === "cancelling";
  const reportHref = `/report?url=${encodeURIComponent(url)}`;

  return (
    <>
      {inProgress && (
        <div className="mx-auto w-full max-w-lg">
          <ScanHeader url={state.url ?? url} phase={state.phase} explanation={IN_PROGRESS_EXPLANATION} />
          <div className="mt-8">
            <ScanProgress stages={state.stages} />
          </div>
          {state.phase !== "cancelling" && (
            <div className="mt-6 text-center">
              <Button variant="secondary" size="sm" onClick={requestCancel}>
                Cancel Scan
              </Button>
            </div>
          )}
        </div>
      )}

      {state.phase === "cancelling" && (
        <CancelScanDialog
          onConfirm={() => {
            confirmCancel();
            router.push("/");
          }}
          onDismiss={dismissCancel}
        />
      )}

      {state.phase === "unavailable" && (
        <ScanError variant="unavailable" message={state.message ?? "This feature isn't built yet."} />
      )}

      {state.phase === "failed" && (
        <ScanError
          variant="failed"
          message={state.message ?? "Something went wrong while analyzing the website."}
          onTryAgain={() => start(url)}
        />
      )}

      {state.phase === "completed" && <ScanCompleted url={state.url ?? url} reportHref={reportHref} />}

      {state.phase === "partial" && (
        <PartialScanNotice url={state.url ?? url} limitations={state.limitations} reportHref={reportHref} />
      )}

      {(state.phase === "idle" || state.phase === "validating") && (
        <p role="status" className="text-center text-sm text-muted">
          Getting ready…
        </p>
      )}
    </>
  );
}

export default function ScanPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-14">
        <Suspense fallback={<p className="text-center text-sm text-muted">Loading…</p>}>
          <ScanPageContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
