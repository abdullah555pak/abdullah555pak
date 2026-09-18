/**
 * Frontend data model for the future SEO report (Category 02 Step 05,
 * Task 12). Pure types only - no logic, no fake data. This is the
 * contract a real backend report endpoint will eventually satisfy;
 * every field that can't be known yet is nullable, and every piece of
 * data carries a DataConfidence so the UI never has to guess how much
 * to trust it.
 *
 * Nothing in production code ever constructs a ReportIssue or
 * populates HealthSummary's numbers - see app/report/page.tsx, which
 * only ever passes empty/null data today. Test fixtures that build
 * example objects from these types live strictly under tests/.
 */

export type DataConfidence = "verified" | "estimated" | "detected" | "unavailable";

export type IssueSeverity = "critical" | "high" | "medium" | "low" | "passed" | "informational";

export type ReportStatus =
  | "loading" // fetching the report right now
  | "not_found" // no report/scan exists for this site yet
  | "processing" // a scan is running (not reachable in production yet)
  | "partial" // scan finished with limitations
  | "failed" // scan failed
  | "ready"; // scan completed successfully (not reachable in production yet)

export type ReportCategoryId =
  | "technical-seo"
  | "performance"
  | "content"
  | "structured-data"
  | "mobile-seo"
  | "accessibility"
  | "ads"
  | "traffic"
  | "keywords"
  | "backlinks"
  | "competitors";

export interface ReportCategoryDefinition {
  id: ReportCategoryId;
  title: string;
  /** One beginner-friendly sentence: what this category checks. */
  description: string;
}

export interface ReportCategorySummary extends ReportCategoryDefinition {
  /** null until a real scan has actually looked at this category. */
  issueCount: number | null;
  confidence: DataConfidence;
}

export interface HealthSummary {
  /** 0-100 once real analysis exists; never a placeholder/random number. */
  overallScore: number | null;
  criticalCount: number | null;
  importantCount: number | null;
  improvementCount: number | null;
  confidence: DataConfidence;
}

/**
 * One concrete piece of proof behind an issue (Category 02 Step 06,
 * Task 3). An issue can have several - e.g. one per affected page - so
 * ReportIssue.evidence is a list of these, not a single blob.
 */
export interface IssueEvidence {
  confidence: DataConfidence;
  url: string | null;
  htmlElement: string | null;
  detectedValue: string | null;
  expectedValue: string | null;
  technicalDetails: string | null;
  screenshotUrl: string | null;
}

/**
 * The four "why it matters" facets Task 2 asks for, beyond the single
 * plain-language sentence in `whyItMatters`. Optional/nullable - a real
 * finding may not always have something meaningful to say on every facet.
 */
export interface IssueImpactDetail {
  seoImpact: string | null;
  userExperienceImpact: string | null;
  searchEngineImpact: string | null;
  businessImpact: string | null;
}

/**
 * What kind of place a fix step happens in (Task 7). Metadata only - it
 * labels a step for a human to read, it never drives any automation.
 */
export type FixInstructionType =
  | "website-code"
  | "wordpress"
  | "shopify"
  | "cms"
  | "hosting"
  | "image"
  | "content"
  | "metadata"
  | "structured-data";

/** One item in an issue's specific fix checklist (Task 6). */
export interface FixStepData {
  id: string;
  title: string;
  description: string;
  helpText: string | null;
  instructionType: FixInstructionType | null;
  actionLabel: string | null;
  actionHref: string | null;
}

export type VerificationStatus =
  | "not_verified" // default and, in production today, the only reachable state
  | "fixed"
  | "improved"
  | "still_needs_attention"
  | "unable_to_verify"
  | "partially_fixed";

/** Task 10: never real until a real re-scan can actually check a fix. */
export interface IssueVerification {
  status: VerificationStatus;
  lastCheckedAt: string | null;
}

export interface ReportIssue {
  id: string;
  title: string;
  /** One sentence, beginner-friendly - shown in list/summary and as the detail page's "what is the problem?" answer. */
  shortExplanation: string;
  /** Longer answer to "why does it matter?" - shown in the detail view. */
  whyItMatters: string;
  /** Optional structured breakdown of whyItMatters - null until a real check has something to say for each facet. */
  whyItMattersDetail: IssueImpactDetail | null;
  severity: IssueSeverity;
  category: ReportCategoryId;
  affectedPages: number | null;
  /** Where this finding came from (e.g. a specific check name) - null until real analysis exists. */
  source: string | null;
  /** Structured proof behind the finding - null/empty until real analysis exists. */
  evidence: IssueEvidence[] | null;
  confidence: DataConfidence;
  fixAvailable: boolean;
  /** The issue-specific fix checklist - null/empty until a real fix guide exists for this finding. */
  fixSteps: FixStepData[] | null;
  difficulty: "easy" | "moderate" | "advanced" | null;
  expectedImpact: "high" | "medium" | "low" | null;
  /** ISO timestamp - null until this issue has actually been detected once. */
  detectedAt: string | null;
  verification: IssueVerification;
  /** Ids of other issues that relate to this one - empty until real analysis can compute this. */
  relatedIssueIds: string[];
}

export interface ReportMeta {
  url: string;
  /** ISO timestamp of the last completed scan, or null if there isn't one. */
  scannedAt: string | null;
  status: ReportStatus;
}

export const REPORT_CATEGORIES: ReportCategoryDefinition[] = [
  {
    id: "technical-seo",
    title: "Technical SEO",
    description: "Whether search engines can properly reach, read, and index your pages.",
  },
  {
    id: "performance",
    title: "Performance",
    description: "How quickly your pages load and respond for visitors.",
  },
  {
    id: "content",
    title: "Content & On-Page SEO",
    description: "Your page titles, descriptions, headings, and written content.",
  },
  {
    id: "structured-data",
    title: "Structured Data",
    description: "Extra hidden information that helps search engines understand your pages.",
  },
  {
    id: "mobile-seo",
    title: "Mobile SEO",
    description: "Whether your site works well for the majority of visitors browsing on a phone.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    description: "Whether people using screen readers or keyboards can use your site.",
  },
  {
    id: "ads",
    title: "Ads & Monetization",
    description: "Ads, affiliate links, or other monetization signals found on your site.",
  },
  {
    id: "traffic",
    title: "Traffic & Audience",
    description: "How many people visit your site and how they find it.",
  },
  {
    id: "keywords",
    title: "Keywords",
    description: "Search terms your site already ranks for, and ones it could target.",
  },
  {
    id: "backlinks",
    title: "Backlinks & Authority",
    description: "Other websites linking to yours.",
  },
  {
    id: "competitors",
    title: "Competitors",
    description: "How your site compares to others you choose.",
  },
];
