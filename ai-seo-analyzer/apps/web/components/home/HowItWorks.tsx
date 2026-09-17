const STEPS = [
  { title: "Enter your website", description: "Paste your website address and click Analyze Website." },
  {
    title: "We check available website data",
    description: "We look at your site's public pages, and connected accounts if you have them.",
  },
  {
    title: "We explain the problems",
    description: "Every issue is explained in plain language, not technical jargon.",
  },
  {
    title: "We guide you through the fixes",
    description: "You get exact, step-by-step instructions for what to do next.",
  },
];

/**
 * A short, skimmable explanation of the process - not a feature list,
 * just enough to set expectations before someone clicks Analyze.
 */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="text-xl font-semibold text-ink">
        How it works
      </h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-2">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-sm font-bold text-accent-strong"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-ink">{step.title}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted">
        Some information may be estimated or unavailable — we&apos;ll always tell you which is
        which, never guess silently.
      </p>
    </section>
  );
}
