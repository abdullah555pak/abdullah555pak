interface ErrorStateProps {
  title?: string;
  message: string;
}

/**
 * Inline, plain-language error surface. Always announced to assistive
 * tech via role="alert" - never a toast that can disappear before it's
 * read, and never a raw error/exception string (the API already
 * guarantees safe messages; this just displays them consistently).
 */
export function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-critical/25 bg-critical-soft px-4 py-3 text-sm text-critical"
    >
      {title && <p className="font-semibold">{title}</p>}
      <p className={title ? "mt-1" : ""}>{message}</p>
    </div>
  );
}
