"use client";

import { useMemo, useState } from "react";
import type { ReportCategoryId, ReportIssue } from "@/lib/report-types";
import { SEVERITY_ORDER } from "@/components/ui/SeverityBadge";

export type SeverityFilter = "all" | ReportIssue["severity"];
export type CategoryFilter = "all" | ReportCategoryId;
export type IssueSortOption = "priority" | "affected-pages" | "category" | "recent";

export const SORT_OPTIONS: { value: IssueSortOption; label: string }[] = [
  { value: "priority", label: "Highest priority" },
  { value: "affected-pages", label: "Most affected pages" },
  { value: "category", label: "Category" },
  { value: "recent", label: "Recently detected" },
];

function sortIssues(issues: ReportIssue[], sort: IssueSortOption): ReportIssue[] {
  const copy = [...issues];
  switch (sort) {
    case "priority":
      return copy.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
    case "affected-pages":
      return copy.sort((a, b) => (b.affectedPages ?? 0) - (a.affectedPages ?? 0));
    case "category":
      return copy.sort((a, b) => a.category.localeCompare(b.category));
    case "recent":
      return copy.sort((a, b) => (b.detectedAt ?? "").localeCompare(a.detectedAt ?? ""));
    default:
      return copy;
  }
}

/**
 * Owns filter/search/sort state and the (pure, unit-tested) logic that
 * applies it - kept separate from how any of it is rendered (Task 12).
 * Works identically whether `issues` is empty (today, always) or full
 * of real data later - nothing here depends on real data existing.
 */
export function useIssueFilters(issues: ReportIssue[]) {
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<IssueSortOption>("priority");

  const filtered = useMemo(() => {
    let result = issues;
    if (severity !== "all") result = result.filter((issue) => issue.severity === severity);
    if (category !== "all") result = result.filter((issue) => issue.category === category);
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery) {
      result = result.filter(
        (issue) =>
          issue.title.toLowerCase().includes(trimmedQuery) ||
          issue.shortExplanation.toLowerCase().includes(trimmedQuery)
      );
    }
    return sortIssues(result, sort);
  }, [issues, severity, category, query, sort]);

  return {
    severity,
    setSeverity,
    category,
    setCategory,
    query,
    setQuery,
    sort,
    setSort,
    filtered,
  };
}
