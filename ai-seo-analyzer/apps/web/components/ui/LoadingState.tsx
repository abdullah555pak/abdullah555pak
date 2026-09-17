/** Small inline spinner. Always paired with a text label nearby - never shown bare. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V1.5A10.5 10.5 0 0 0 1.5 12H4Z"
      />
    </svg>
  );
}

interface LoadingLineProps {
  label: string;
}

/** A labeled loading row for a section that's fetching something real. */
export function LoadingLine({ label }: LoadingLineProps) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
