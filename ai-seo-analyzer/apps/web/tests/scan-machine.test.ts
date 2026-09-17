import { describe, expect, it } from "vitest";
import { initialScanState, scanReducer } from "@/lib/scan-machine";

describe("scanReducer (Category 02 Step 04, Task 14 state model)", () => {
  it("goes idle -> validating -> starting on submit and request-started", () => {
    let state = scanReducer(initialScanState, { type: "SUBMIT", url: "example.com" });
    expect(state.phase).toBe("validating");
    expect(state.url).toBe("example.com");

    state = scanReducer(state, { type: "REQUEST_STARTED" });
    expect(state.phase).toBe("starting");
    expect(state.stages).toHaveLength(9);
    expect(state.stages.every((s) => s.status === "pending")).toBe(true);
  });

  it("goes to unavailable on NOT_IMPLEMENTED, carrying the safe message", () => {
    let state = scanReducer(initialScanState, { type: "SUBMIT", url: "example.com" });
    state = scanReducer(state, { type: "REQUEST_STARTED" });
    state = scanReducer(state, { type: "NOT_IMPLEMENTED", message: "Not built yet." });

    expect(state.phase).toBe("unavailable");
    expect(state.message).toBe("Not built yet.");
  });

  it("goes to failed on FAILED, carrying the safe message", () => {
    let state = scanReducer(initialScanState, { type: "SUBMIT", url: "example.com" });
    state = scanReducer(state, { type: "REQUEST_STARTED" });
    state = scanReducer(state, { type: "FAILED", message: "Something went wrong." });

    expect(state.phase).toBe("failed");
    expect(state.message).toBe("Something went wrong.");
  });

  it("goes to completed on COMPLETED, and to partial with limitations on PARTIAL", () => {
    let base = scanReducer(initialScanState, { type: "SUBMIT", url: "example.com" });
    base = scanReducer(base, { type: "REQUEST_STARTED" });

    const completed = scanReducer(base, { type: "COMPLETED" });
    expect(completed.phase).toBe("completed");

    const partial = scanReducer(base, { type: "PARTIAL", limitations: ["3 pages unreachable."] });
    expect(partial.phase).toBe("partial");
    expect(partial.limitations).toEqual(["3 pages unreachable."]);
  });

  it("supports cancel: request -> confirm returns to a clean idle state", () => {
    let state = scanReducer(initialScanState, { type: "SUBMIT", url: "example.com" });
    state = scanReducer(state, { type: "REQUEST_STARTED" });
    state = scanReducer(state, { type: "CANCEL_REQUESTED" });
    expect(state.phase).toBe("cancelling");

    state = scanReducer(state, { type: "CANCEL_CONFIRMED" });
    expect(state).toEqual(initialScanState);
  });

  it("supports cancel: request -> dismiss resumes the exact phase it was in", () => {
    let state = scanReducer(initialScanState, { type: "SUBMIT", url: "example.com" });
    state = scanReducer(state, { type: "REQUEST_STARTED" }); // phase: starting
    state = scanReducer(state, { type: "CANCEL_REQUESTED" });
    expect(state.phase).toBe("cancelling");

    state = scanReducer(state, { type: "CANCEL_DISMISSED" });
    expect(state.phase).toBe("starting");
    expect(state.url).toBe("example.com");
    expect(state.stages).toHaveLength(9);
  });

  it("never leaves a broken state after cancelling - a fresh SUBMIT works normally afterward", () => {
    let state = scanReducer(initialScanState, { type: "SUBMIT", url: "example.com" });
    state = scanReducer(state, { type: "REQUEST_STARTED" });
    state = scanReducer(state, { type: "CANCEL_REQUESTED" });
    state = scanReducer(state, { type: "CANCEL_CONFIRMED" });

    state = scanReducer(state, { type: "SUBMIT", url: "another-example.com" });
    expect(state.phase).toBe("validating");
    expect(state.url).toBe("another-example.com");
    expect(state.message).toBeNull();
  });

  it("ignores actions that don't make sense for the current phase", () => {
    // Can't cancel something that never started.
    const stillIdle = scanReducer(initialScanState, { type: "CANCEL_REQUESTED" });
    expect(stillIdle).toEqual(initialScanState);

    // Can't complete something that was never started.
    const stillIdle2 = scanReducer(initialScanState, { type: "COMPLETED" });
    expect(stillIdle2).toEqual(initialScanState);
  });

  it("bumps attemptId on every SUBMIT, even for the identical URL - this is what lets a retry of the same site actually re-run the request (hooks/useScan.ts keys its effect on attemptId, not on phase, precisely to avoid a re-render loop discarding a real in-flight result)", () => {
    let state = scanReducer(initialScanState, { type: "SUBMIT", url: "example.com" });
    expect(state.attemptId).toBe(1);

    state = scanReducer(state, { type: "REQUEST_STARTED" });
    expect(state.attemptId).toBe(1); // REQUEST_STARTED must never bump it

    state = scanReducer(state, { type: "FAILED", message: "Something went wrong." });
    state = scanReducer(state, { type: "SUBMIT", url: "example.com" }); // retry, same URL
    expect(state.attemptId).toBe(2);
  });
});
