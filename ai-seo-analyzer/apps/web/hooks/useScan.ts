"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { analyzeWebsite, type AnalyzeResult } from "@/lib/api-client";
import { looksLikeWebsiteAddress } from "@/lib/url-format";
import { initialScanState, scanReducer, type ScanState } from "@/lib/scan-machine";

export interface UseScanOptions {
  /**
   * Injectable so tests can drive every outcome without a real network
   * call. Production code never sets this - it defaults to the real API.
   */
  runAnalysis?: (url: string, signal?: AbortSignal) => Promise<AnalyzeResult>;
}

export interface UseScanResult {
  state: ScanState;
  start: (url: string) => void;
  requestCancel: () => void;
  confirmCancel: () => void;
  dismissCancel: () => void;
  reset: () => void;
}

/**
 * Drives the scan state machine against the real API. This is the one
 * place a future crawler/orchestrator integration plugs in - see the
 * "COMPLETED" / "PARTIAL" dispatch points below, which nothing in the
 * app currently triggers because the backend has no scan endpoint yet.
 */
export function useScan(options: UseScanOptions = {}): UseScanResult {
  const runAnalysis = options.runAnalysis ?? analyzeWebsite;
  const [state, dispatch] = useReducer(scanReducer, initialScanState);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback((url: string) => {
    dispatch({ type: "SUBMIT", url });
  }, []);

  useEffect(() => {
    if (state.phase !== "validating" || !state.url) return;

    if (!looksLikeWebsiteAddress(state.url)) {
      dispatch({
        type: "FAILED",
        message: "Please enter a complete website address, such as https://example.com",
      });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let live = true;
    const url = state.url;

    dispatch({ type: "REQUEST_STARTED" });

    void (async () => {
      const result = await runAnalysis(url, controller.signal);
      if (!live) return;

      switch (result.kind) {
        case "not_implemented":
          dispatch({ type: "NOT_IMPLEMENTED", message: result.message });
          break;
        case "cancelled":
          // The cancel button already dispatched CANCEL_CONFIRMED.
          break;
        case "invalid":
        case "network_error":
        case "unexpected_error":
          dispatch({ type: "FAILED", message: result.message });
          break;
      }
    })();

    return () => {
      live = false;
    };
    // Keyed on attemptId, not phase/url: this effect must fire exactly
    // once per SUBMIT (including a retry of the identical URL) and must
    // NOT re-run when its own REQUEST_STARTED dispatch changes `phase` -
    // that re-run would clean up (live = false) and silently swallow the
    // real, still-in-flight response. See lib/scan-machine.ts.
  }, [state.attemptId]);

  const requestCancel = useCallback(() => dispatch({ type: "CANCEL_REQUESTED" }), []);

  const confirmCancel = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "CANCEL_CONFIRMED" });
  }, []);

  const dismissCancel = useCallback(() => dispatch({ type: "CANCEL_DISMISSED" }), []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, start, requestCancel, confirmCancel, dismissCancel, reset };
}
