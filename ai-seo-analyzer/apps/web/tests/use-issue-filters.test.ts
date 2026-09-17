import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIssueFilters } from "@/hooks/useIssueFilters";
import type { ReportIssue } from "@/lib/report-types";

function makeIssue(overrides: Partial<ReportIssue>): ReportIssue {
  return {
    id: "issue-1",
    title: "Example issue",
    shortExplanation: "Example explanation.",
    whyItMatters: "Example reason.",
    severity: "medium",
    category: "technical-seo",
    affectedPages: 1,
    evidence: null,
    confidence: "detected",
    fixAvailable: true,
    howToFix: null,
    difficulty: null,
    expectedImpact: null,
    detectedAt: "2026-01-01",
    ...overrides,
  };
}

const FIXTURES: ReportIssue[] = [
  makeIssue({ id: "a", title: "Missing meta description", severity: "critical", category: "content", affectedPages: 5, detectedAt: "2026-01-03" }),
  makeIssue({ id: "b", title: "Slow homepage", severity: "high", category: "performance", affectedPages: 1, detectedAt: "2026-01-01" }),
  makeIssue({ id: "c", title: "Missing alt text", severity: "low", category: "content", affectedPages: 10, detectedAt: "2026-01-02" }),
];

describe("useIssueFilters (Task 5 filter/search/sort logic, pure and framework-testable)", () => {
  it("returns every issue unfiltered by default", () => {
    const { result } = renderHook(() => useIssueFilters(FIXTURES));
    expect(result.current.filtered).toHaveLength(3);
  });

  it("filters by severity", () => {
    const { result } = renderHook(() => useIssueFilters(FIXTURES));
    act(() => result.current.setSeverity("critical"));
    expect(result.current.filtered.map((i) => i.id)).toEqual(["a"]);
  });

  it("filters by category", () => {
    const { result } = renderHook(() => useIssueFilters(FIXTURES));
    act(() => result.current.setCategory("content"));
    expect(result.current.filtered.map((i) => i.id).sort()).toEqual(["a", "c"]);
  });

  it("searches by title and explanation, case-insensitively", () => {
    const { result } = renderHook(() => useIssueFilters(FIXTURES));
    act(() => result.current.setQuery("META description"));
    expect(result.current.filtered.map((i) => i.id)).toEqual(["a"]);
  });

  it("sorts by highest priority by default (critical first)", () => {
    const { result } = renderHook(() => useIssueFilters(FIXTURES));
    expect(result.current.filtered.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("sorts by most affected pages", () => {
    const { result } = renderHook(() => useIssueFilters(FIXTURES));
    act(() => result.current.setSort("affected-pages"));
    expect(result.current.filtered.map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by most recently detected", () => {
    const { result } = renderHook(() => useIssueFilters(FIXTURES));
    act(() => result.current.setSort("recent"));
    expect(result.current.filtered.map((i) => i.id)).toEqual(["a", "c", "b"]);
  });

  it("works correctly with an empty issue list - the real production case today", () => {
    const { result } = renderHook(() => useIssueFilters([]));
    act(() => result.current.setSeverity("critical"));
    act(() => result.current.setQuery("anything"));
    expect(result.current.filtered).toEqual([]);
  });
});
