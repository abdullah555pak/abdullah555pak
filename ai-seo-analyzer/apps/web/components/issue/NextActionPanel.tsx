import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

interface NextActionPanelProps {
  reportHref: string;
  scanHref: string;
}

/** Task 11: "What should I do next?" - a small, always-available set of ways forward. */
export function NextActionPanel({ reportHref, scanHref }: NextActionPanelProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">What should I do next?</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        <ButtonLink href={reportHref} variant="secondary" size="sm">
          Back to all problems
        </ButtonLink>
        <ButtonLink href={scanHref} variant="secondary" size="sm">
          Re-scan this website
        </ButtonLink>
      </div>
    </Card>
  );
}
