import type { ReportIssue } from "@/lib/report-types";

interface WhyItMattersProps {
  issue: ReportIssue;
}

const FACET_LABELS: { key: keyof NonNullable<ReportIssue["whyItMattersDetail"]>; label: string }[] = [
  { key: "seoImpact", label: "SEO impact" },
  { key: "userExperienceImpact", label: "User experience impact" },
  { key: "searchEngineImpact", label: "Search engine impact" },
  { key: "businessImpact", label: "Business impact" },
];

/**
 * Task 3: "Why does it matter?" - the main plain-language answer, plus
 * an optional breakdown across SEO/UX/search-engine/business facets
 * when a real check has something specific to say for each.
 */
export function WhyItMatters({ issue }: WhyItMattersProps) {
  const detail = issue.whyItMattersDetail;
  const facets = detail ? FACET_LABELS.filter(({ key }) => detail[key]) : [];

  return (
    <section aria-labelledby="issue-why-heading">
      <h2 id="issue-why-heading" className="text-lg font-semibold text-ink">
        Why does it matter?
      </h2>
      <p className="mt-1.5 text-sm text-ink-soft">{issue.whyItMatters}</p>

      {facets.length > 0 && (
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {facets.map(({ key, label }) => (
            <div key={key} className="rounded-lg border border-border bg-surface-2 p-3">
              <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
              <dd className="mt-0.5 text-sm text-ink">{detail![key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
