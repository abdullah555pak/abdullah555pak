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

export interface ReportIssue {
  id: string;
  title: string;
  /** One sentence, beginner-friendly - shown in list/summary views. */
  shortExplanation: string;
  /** Longer answer to "why does it matter?" - shown in the detail view. */
  whyItMatters: string;
  severity: IssueSeverity;
  category: ReportCategoryId;
  affectedPages: number | null;
  /** Raw technical detail (a header, a selector) - shown behind a toggle. */
  evidence: string | null;
  confidence: DataConfidence;
  fixAvailable: boolean;
  howToFix: string[] | null;
  difficulty: "easy" | "medium" | "hard" | null;
  expectedImpact: "high" | "medium" | "low" | null;
  /** ISO timestamp - null until this issue has actually been detected once. */
  detectedAt: string | null;
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
