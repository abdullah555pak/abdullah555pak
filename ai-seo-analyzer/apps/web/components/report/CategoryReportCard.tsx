import type { ReportCategorySummary } from "@/lib/report-types";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Button } from "@/components/ui/Button";

interface CategoryReportCardProps {
  category: ReportCategorySummary;
  onViewDetails?: (categoryId: string) => void;
}

/**
 * Task 3: one card per SEO category on the overview grid. Never
 * implies a category has been analyzed - issue counts show "—" and
 * the confidence badge reads "Unavailable" until a real check exists.
 */
export function CategoryReportCard({ category, onViewDetails }: CategoryReportCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
        <h3 className="min-w-0 font-semibold text-ink">{category.title}</h3>
        <span className="shrink-0">
          <ConfidenceBadge level={category.confidence} />
        </span>
      </div>
      <p className="text-sm text-ink-soft">{category.description}</p>
      <p className="text-xs text-muted">
        {category.issueCount === null
          ? "Not analyzed yet"
          : `${category.issueCount} issue${category.issueCount === 1 ? "" : "s"} found`}
      </p>
      <div className="mt-1">
        <Button size="sm" variant="secondary" onClick={() => onViewDetails?.(category.id)}>
          View details
        </Button>
      </div>
    </Card>
  );
}
