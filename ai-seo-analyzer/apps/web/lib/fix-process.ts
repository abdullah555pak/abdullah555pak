import type { FixInstructionType } from "./report-types";

export interface FixProcessStep {
  id: string;
  title: string;
  description: string;
}

/**
 * The generic, always-the-same explanation of *how* fixing something in
 * Sitewell works (Category 02 Step 06, Task 5). These 7 steps describe
 * the process, not any specific issue - they render identically no
 * matter which issue page they're shown on, so they can never be
 * mistaken for a fabricated finding.
 */
export const FIX_PROCESS_STEPS: FixProcessStep[] = [
  {
    id: "understand",
    title: "Understand the issue",
    description: "Read what's wrong and why it matters above, so you know what you're aiming to fix.",
  },
  {
    id: "open",
    title: "Open the right page or settings",
    description: "Go to the page, template, or settings area on your own website where this needs to change.",
  },
  {
    id: "make-change",
    title: "Make the change",
    description: "Follow the specific steps in the checklist below for this issue, if any are available yet.",
  },
  {
    id: "save-publish",
    title: "Save and publish",
    description: "Save your change and make sure it's actually published - a draft or unsaved edit won't count.",
  },
  {
    id: "return",
    title: "Return to Sitewell",
    description: "Come back to this page once your change is live on your website.",
  },
  {
    id: "rescan",
    title: "Run a new scan",
    description: "Re-scan your website so Sitewell can look at the current, updated version of your page.",
  },
  {
    id: "verify",
    title: "Check the result",
    description: "Once a new scan finishes, come back here to see whether the issue was resolved.",
  },
];

export const FIX_INSTRUCTION_TYPE_LABELS: Record<FixInstructionType, string> = {
  "website-code": "Website code",
  wordpress: "WordPress",
  shopify: "Shopify",
  cms: "Other CMS",
  hosting: "Hosting settings",
  image: "Image file",
  content: "Page content",
  metadata: "Page metadata",
  "structured-data": "Structured data",
};
