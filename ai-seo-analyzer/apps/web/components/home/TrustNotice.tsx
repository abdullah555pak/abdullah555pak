const POINTS = [
  "We only check information that's publicly available on your website.",
  "Some data, like real visitor traffic, needs you to connect your own account (such as Google Analytics) — we can't see it otherwise.",
  "Traffic and advertising history aren't always available for every site.",
  "Anything we estimate instead of verify is always clearly labeled as an estimate.",
  "We never guarantee where you'll rank on Google — no honest tool can.",
];

/**
 * Sets expectations plainly, without turning the homepage into a wall
 * of legal-sounding warnings. Always visible - this isn't something to
 * bury, but it stays short.
 */
export function TrustNotice() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="rounded-2xl border border-border bg-surface-2/60 p-5"
    >
      <h2 id="trust-heading" className="text-sm font-semibold text-ink">
        Good to know before you start
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink-soft">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden="true" />
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
