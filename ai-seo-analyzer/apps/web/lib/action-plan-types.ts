import type { ReportIssue } from "./report-types";

/**
 * Category 02 Step 07 data model. An action IS an issue - same
 * evidence, same fix guide, same "why it matters" - viewed through a
 * to-do-list lens instead of a report lens. Extending ReportIssue
 * (rather than redefining its fields) is what keeps this compatible
 * with the report/issue model and lets the Action Detail view reuse
 * every Step 06 component (IssueExplanation, WhyItMatters,
 * EvidencePanel, FixGuide, ReadyToVerify, ...) unmodified.
 *
 * Two fields an issue doesn't need but an action-plan item does:
 *   - order: this item's position in the recommended fix sequence
 *   - status: where the user is in acting on it (distinct from
 *     `verification`, which is the outcome of one particular re-scan
 *     check - status is the broader "have I even started this yet?")
 */
export interface ActionPlanItem extends ReportIssue {
  order: number;
  status: ActionStatus;
}

export type ActionStatus =
  | "not_started"
  | "in_progress"
  | "ready_to_verify"
  | "verified"
  | "needs_attention"
  | "unable_to_verify";

export const ACTION_STATUS_META: Record<ActionStatus, { label: string; tone: "muted" | "info" | "gold" | "good" | "warn" }> = {
  not_started: { label: "Not started", tone: "muted" },
  in_progress: { label: "In progress", tone: "info" },
  ready_to_verify: { label: "Ready to verify", tone: "gold" },
  verified: { label: "Verified", tone: "good" },
  needs_attention: { label: "Needs attention", tone: "warn" },
  unable_to_verify: { label: "Unable to verify", tone: "muted" },
};

/** The 5 filterable statuses from Task 8 - "Unable to verify" is a real
 *  status an action can have, but isn't offered as its own filter. */
export const ACTION_STATUS_FILTER_ORDER: ActionStatus[] = [
  "not_started",
  "in_progress",
  "ready_to_verify",
  "verified",
  "needs_attention",
];

/** Task 6's simple step-by-step grouping - UI structure only. The real
 *  ordering will come from real issue severity/evidence/impact/
 *  dependencies once a real analyzer exists; this is not a hardcoded
 *  SEO rule, just the section headings the UI groups actions under. */
export type ActionPlanStage =
  | "urgent-technical"
  | "important-content"
  | "performance"
  | "structured-data"
  | "other-seo";

export interface ActionPlanStageDefinition {
  id: ActionPlanStage;
  title: string;
}

export const ACTION_PLAN_STAGES: ActionPlanStageDefinition[] = [
  { id: "urgent-technical", title: "1. Fix urgent technical problems" },
  { id: "important-content", title: "2. Fix important page & content problems" },
  { id: "performance", title: "3. Improve performance" },
  { id: "structured-data", title: "4. Improve structured data" },
  { id: "other-seo", title: "5. Improve other SEO areas" },
];
