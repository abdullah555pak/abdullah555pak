import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingLine } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ButtonLink } from "@/components/ui/Button";

export type ReportStatusKind =
  | "loading"
  | "not_found"
  | "processing"
  | "partial"
  | "failed"
  | "unavailable"
  | "no_matches";

interface ReportStatusMessageProps {
  kind: ReportStatusKind;
  /** Where "Analyze this website" / "Re-scan" should send the user. */
  scanHref?: string;
}

/**
 * Every "there's nothing to show here (yet)" state in the report, in
 * one place (Task 13). Critically: "no_matches" (a filter matched
 * nothing) is a different, distinct message from every other state -
 * we never say "no issues found" just because the analyzer hasn't
 * been built. That distinction is the whole point of this component.
 */
export function ReportStatusMessage({ kind, scanHref }: ReportStatusMessageProps) {
  switch (kind) {
    case "loading":
      return <LoadingLine label="Loading report…" />;

    case "not_found":
      return (
        <EmptyState
          title="No report available"
          description="We don't have a scan for this website yet."
          action={scanHref && <ButtonLink href={scanHref}>Analyze this website</ButtonLink>}
        />
      );

    case "processing":
      return <LoadingLine label="Your report is still being put together…" />;

    case "partial":
      return (
        <EmptyState
          title="Report partially available"
          description="Some sections finished, but others couldn't be completed. They're marked below."
        />
      );

    case "failed":
      return <ErrorState title="Report failed" message="We couldn't finish analyzing this website." />;

    case "no_matches":
      return (
        <EmptyState
          title="No issues match your filters"
          description="Try a different category, severity, or search term."
        />
      );

    case "unavailable":
    default:
      return (
        <EmptyState
          title="Real scan data is not available yet"
          description="This section will show real results once the analysis engine that checks it has been built."
        />
      );
  }
}
