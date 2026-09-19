import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

interface ActionEmptyStateProps {
  scanHref?: string;
}

/**
 * Task 2's required real-today state: a URL exists but zero actions
 * do, because no real analysis has ever run. Deliberately not worded
 * "no problems found" - that would imply a clean bill of health this
 * app has no basis to claim.
 */
export function ActionEmptyState({ scanHref }: ActionEmptyStateProps) {
  return (
    <EmptyState
      title="No action plan yet"
      description="Your action plan will appear here after your website has been analyzed."
      action={scanHref && <ButtonLink href={scanHref}>Analyze this website</ButtonLink>}
    />
  );
}
