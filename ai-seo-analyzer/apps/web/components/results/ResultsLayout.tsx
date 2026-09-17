import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";

interface ResultsSection {
  id: string;
  title: string;
  description: string;
}

const SECTIONS: ResultsSection[] = [
  {
    id: "problems",
    title: "Problems",
    description: "Every issue we find will be listed here, most important first.",
  },
  {
    id: "technical-seo",
    title: "Technical SEO",
    description: "Checks like HTTPS, broken links, and whether your site works on phones.",
  },
  {
    id: "performance",
    title: "Performance",
    description: "How fast your pages load and feel to use.",
  },
  {
    id: "content",
    title: "Content",
    description: "Page titles, descriptions, headings, and other on-page basics.",
  },
  {
    id: "ads",
    title: "Ads & monetization",
    description: "Signals about ads or affiliate links found on your site.",
  },
  {
    id: "traffic",
    title: "Traffic & audience",
    description: "Real visitor numbers, once you connect an analytics account.",
  },
  {
    id: "keywords",
    title: "Keywords",
    description: "Search terms your site could target.",
  },
  {
    id: "backlinks",
    title: "Backlinks",
    description: "Other websites linking to yours.",
  },
  {
    id: "competitors",
    title: "Competitors",
    description: "Compare your site to others you choose.",
  },
  {
    id: "action-plan",
    title: "Action plan",
    description: "A prioritized, step-by-step to-do list built from your results.",
  },
];

/**
 * Structural shell for the future results page. Every section is
 * honestly marked as not implemented - nothing here invents a score,
 * a finding, or a number. Swap each EmptyState for real content only
 * once the feature behind it actually exists.
 */
export function ResultsLayout() {
  return (
    <div>
      <SectionHeader title="Overview" />
      <Card className="flex flex-col items-center gap-2 border-dashed bg-surface-2/60 py-8 text-center">
        <span className="font-mono text-3xl font-bold text-muted" aria-hidden="true">
          —
        </span>
        <p className="text-sm text-muted">
          Your overall score will appear here once the SEO analysis engine is built. We&apos;ll
          never show a number that isn&apos;t real.
        </p>
      </Card>

      {SECTIONS.map((section) => (
        <div key={section.id} id={section.id}>
          <SectionHeader title={section.title} />
          <EmptyState
            title="Not implemented yet"
            description={`${section.description} This section is not built yet — check back after this feature ships.`}
          />
        </div>
      ))}
    </div>
  );
}
