/**
 * The stages a real scan will eventually go through, and their status
 * values. None of these stages run today - the backend only validates
 * the URL and responds "not implemented" (see docs/BLUEPRINT.md Phase
 * 1). This file exists so the UI has a stable shape to render against
 * now, and a real backend can drive it later without any component
 * changes - see app/scan/page.tsx for exactly where that wiring goes.
 */

export type StageStatus =
  | "pending" // not started yet
  | "running" // actively being checked right now
  | "completed" // finished successfully
  | "failed" // this stage specifically errored
  | "skipped" // deliberately not run (e.g. disallowed by robots.txt)
  | "not_available"; // this stage isn't offered for this scan/plan

export interface ScanStageDefinition {
  id: string;
  label: string;
  /** Beginner-friendly, one-sentence explanation of what this stage does. */
  description: string;
}

export interface ScanStageState extends ScanStageDefinition {
  status: StageStatus;
}

export const SCAN_STAGE_DEFINITIONS: ScanStageDefinition[] = [
  {
    id: "checking-accessibility",
    label: "Checking website accessibility",
    description: "We're checking whether the website can be reached.",
  },
  {
    id: "discovering-pages",
    label: "Discovering pages",
    description: "We're finding the pages on your website to check.",
  },
  {
    id: "checking-technical-seo",
    label: "Checking technical SEO",
    description: "We're looking for basic technical issues that affect search engines.",
  },
  {
    id: "checking-page-structure",
    label: "Checking page structure",
    description: "We're looking at titles, headings, links, and other page elements.",
  },
  {
    id: "checking-performance",
    label: "Checking performance",
    description: "We're checking how quickly important pages load.",
  },
  {
    id: "checking-content",
    label: "Checking content",
    description: "We're reviewing your page text and descriptions.",
  },
  {
    id: "checking-structured-data",
    label: "Checking structured data",
    description: "We're looking for extra information that helps search engines understand your pages.",
  },
  {
    id: "checking-ads",
    label: "Checking ads",
    description: "We're checking for ads or monetization on your site.",
  },
  {
    id: "preparing-report",
    label: "Preparing report",
    description: "We're putting together your results.",
  },
];

/** Every stage in its initial, honest state: nothing has run yet. */
export function initialStageStates(): ScanStageState[] {
  return SCAN_STAGE_DEFINITIONS.map((stage) => ({ ...stage, status: "pending" }));
}
