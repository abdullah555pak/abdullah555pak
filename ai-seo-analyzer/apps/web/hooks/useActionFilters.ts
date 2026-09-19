"use client";

import { useMemo, useState } from "react";
import type { ReportCategoryId } from "@/lib/report-types";
import type { ActionPlanItem, ActionStatus } from "@/lib/action-plan-types";

export type ActionCategoryFilterValue = "all" | ReportCategoryId;
export type ActionStatusFilterValue = "all" | ActionStatus;

/**
 * Owns the Action Plan's search/category/status state and the pure
 * filtering logic (Category 02 Step 07, Tasks 7-9) - mirrors
 * hooks/useIssueFilters.ts's shape. Works identically whether `actions`
 * is empty (today, always) or full of real data later.
 */
export function useActionFilters(actions: ActionPlanItem[]) {
  const [category, setCategory] = useState<ActionCategoryFilterValue>("all");
  const [status, setStatus] = useState<ActionStatusFilterValue>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let result = actions;
    if (category !== "all") result = result.filter((action) => action.category === category);
    if (status !== "all") result = result.filter((action) => action.status === status);

    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery) {
      result = result.filter(
        (action) =>
          action.title.toLowerCase().includes(trimmedQuery) ||
          action.shortExplanation.toLowerCase().includes(trimmedQuery) ||
          action.category.toLowerCase().includes(trimmedQuery)
      );
    }

    return [...result].sort((a, b) => a.order - b.order);
  }, [actions, category, status, query]);

  return { category, setCategory, status, setStatus, query, setQuery, filtered };
}
