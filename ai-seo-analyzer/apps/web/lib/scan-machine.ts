import { initialStageStates, type ScanStageState } from "./scan-stages";

/**
 * The scan state model (Category 02 Step 04, Task 14). Pure and
 * framework-free so it can be unit-tested without React or a network -
 * see hooks/useScan.ts for the React wiring, and tests/scan-machine.test.ts
 * for coverage of every transition.
 */
export type ScanPhase =
  | "idle"
  | "validating"
  | "starting"
  | "scanning"
  | "cancelling"
  | "completed"
  | "partial"
  | "failed"
  | "unavailable";

export interface ScanState {
  phase: ScanPhase;
  url: string | null;
  stages: ScanStageState[];
  /** Set on "failed" and "unavailable". */
  message: string | null;
  /** Set on "partial" - which areas couldn't be checked, in plain language. */
  limitations: string[];
  /** The in-progress phase to return to if a cancel is dismissed. */
  resumePhase: "starting" | "scanning" | null;
  /**
   * Incremented on every SUBMIT. hooks/useScan.ts keys its request effect
   * on this, not on `phase` - so the effect fires exactly once per scan
   * attempt (including a retry of the same URL) and is never re-triggered
   * by its own REQUEST_STARTED dispatch changing `phase`.
   */
  attemptId: number;
}

export const initialScanState: ScanState = {
  phase: "idle",
  url: null,
  stages: [],
  message: null,
  limitations: [],
  resumePhase: null,
  attemptId: 0,
};

export type ScanAction =
  | { type: "SUBMIT"; url: string }
  | { type: "REQUEST_STARTED" }
  | { type: "NOT_IMPLEMENTED"; message: string }
  | { type: "FAILED"; message: string }
  | { type: "PARTIAL"; limitations: string[] }
  | { type: "COMPLETED" }
  | { type: "CANCEL_REQUESTED" }
  | { type: "CANCEL_CONFIRMED" }
  | { type: "CANCEL_DISMISSED" }
  | { type: "RESET" };

export function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case "SUBMIT":
      return {
        ...initialScanState,
        phase: "validating",
        url: action.url,
        attemptId: state.attemptId + 1,
      };

    case "REQUEST_STARTED":
      if (state.phase !== "validating" && state.phase !== "cancelling") return state;
      return { ...state, phase: "starting", stages: initialStageStates() };

    case "NOT_IMPLEMENTED":
      if (state.phase !== "starting" && state.phase !== "scanning") return state;
      return { ...state, phase: "unavailable", message: action.message };

    case "FAILED":
      if (state.phase === "idle") return state;
      return { ...state, phase: "failed", message: action.message };

    case "PARTIAL":
      if (state.phase !== "starting" && state.phase !== "scanning") return state;
      return { ...state, phase: "partial", limitations: action.limitations };

    case "COMPLETED":
      if (state.phase !== "starting" && state.phase !== "scanning") return state;
      return { ...state, phase: "completed" };

    case "CANCEL_REQUESTED":
      if (state.phase !== "starting" && state.phase !== "scanning") return state;
      return { ...state, phase: "cancelling", resumePhase: state.phase };

    case "CANCEL_CONFIRMED":
      return { ...initialScanState };

    case "CANCEL_DISMISSED":
      if (state.phase !== "cancelling") return state;
      return { ...state, phase: state.resumePhase ?? "scanning", resumePhase: null };

    case "RESET":
      return { ...initialScanState };

    default:
      return state;
  }
}
