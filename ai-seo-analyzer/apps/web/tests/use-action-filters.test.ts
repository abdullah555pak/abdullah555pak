import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActionFilters } from "@/hooks/useActionFilters";
import type { ActionPlanItem } from "@/lib/action-plan-types";

function makeAction(overrides: Partial<ActionPlanItem>): ActionPlanItem {
  return {
    id: "action-1",
    order: 1,
    status: "not_started",
    title: "Example action",
    shortExplanation: "Example explanation.",
    whyItMatters: "Example reason.",
    whyItMattersDetail: null,
    severity: "medium",
    category: "technical-seo",
    affectedPages: 1,
    source: null,
    evidence: null,
    confidence: "detected",
    fixAvailable: true,
    fixSteps: null,
    difficulty: null,
    expectedImpact: null,
    detectedAt: "2026-01-01",
    verification: { status: "not_verified", lastCheckedAt: null },
    relatedIssueIds: [],
    ...overrides,
  };
}

const FIXTURES: ActionPlanItem[] = [
  makeAction({ id: "a", order: 1, title: "Missing meta description", category: "content", status: "not_started" }),
  makeAction({ id: "b", order: 2, title: "Slow homepage", category: "performance", status: "in_progress" }),
  makeAction({ id: "c", order: 3, title: "Missing alt text", category: "content", status: "verified" }),
];

describe("useActionFilters (Category 02 Step 07, Tasks 7-9)", () => {
  it("returns every action unfiltered by default, sorted by order", () => {
    const { result } = renderHook(() => useActionFilters(FIXTURES));
    expect(result.current.filtered.map((a) => a.id)).toEqual(["a", "b", "c"]);
  });

  it("filters by category", () => {
    const { result } = renderHook(() => useActionFilters(FIXTURES));
    act(() => result.current.setCategory("content"));
    expect(result.current.filtered.map((a) => a.id)).toEqual(["a", "c"]);
  });

  it("filters by status", () => {
    const { result } = renderHook(() => useActionFilters(FIXTURES));
    act(() => result.current.setStatus("in_progress"));
    expect(result.current.filtered.map((a) => a.id)).toEqual(["b"]);
  });

  it("searches by title, explanation, and category", () => {
    const { result } = renderHook(() => useActionFilters(FIXTURES));
    act(() => result.current.setQuery("META description"));
    expect(result.current.filtered.map((a) => a.id)).toEqual(["a"]);
  });

  it("combines filters", () => {
    const { result } = renderHook(() => useActionFilters(FIXTURES));
    act(() => result.current.setCategory("content"));
    act(() => result.current.setStatus("verified"));
    expect(result.current.filtered.map((a) => a.id)).toEqual(["c"]);
  });

  it("works correctly with an empty action list - the real production case today", () => {
    const { result } = renderHook(() => useActionFilters([]));
    act(() => result.current.setStatus("verified"));
    act(() => result.current.setQuery("anything"));
    expect(result.current.filtered).toEqual([]);
  });
});
