import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingLine } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ButtonLink } from "@/components/ui/Button";

export type ActionUnavailableKind =
  | "no_scan"
  | "processing"
  | "partial"
  | "failed"
  | "unavailable"
  | "no_matches";

interface ActionUnavailableStateProps {
  kind: ActionUnavailableKind;
  scanHref?: string;
}

/**
 * Task 12's remaining states, built from the same primitives as
 * ReportStatusMessage (EmptyState/ErrorState/LoadingLine) but with
 * copy specific to the Action Plan rather than the Report - "Scan
 * failed" reads correctly here in a way ReportStatusMessage's
 * "Report failed" wouldn't.
 */
export function ActionUnavailableState({ kind, scanHref }: ActionUnavailableStateProps) {
  switch (kind) {
    case "no_scan":
      return (
        <EmptyState
          title="No scan yet"
          description="We don't have a scan for this website yet."
          action={scanHref && <ButtonLink href={scanHref}>Analyze this website</ButtonLink>}
        />
      );

    case "processing":
      return <LoadingLine label="Your action plan is still being put together…" />;

    case "partial":
      return (
        <EmptyState
          title="Partial action plan"
          description="Some actions are ready, but others couldn't be generated yet. They're marked below."
        />
      );

    case "failed":
      return <ErrorState title="Scan failed" message="We couldn't finish analyzing this website." />;

    case "no_matches":
      return (
        <EmptyState
          title="No actions match your filters"
          description="Try a different category, status, or search term."
        />
      );

    case "unavailable":
    default:
      return (
        <EmptyState
          title="Data unavailable"
          description="This part of your action plan isn't available yet."
        />
      );
  }
}
