import Link from "next/link";

/**
 * Deliberately minimal per the UI/UX blueprint's "minimal navigation"
 * rule: no nav links to screens that don't exist yet (accounts, pricing,
 * dashboard aren't built). Just the brand, always linking home.
 */
export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M11 4a7 7 0 1 0 4.9 12l4.05 4.05a1 1 0 0 0 1.4-1.4L17.3 14.6A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"
                fill="currentColor"
              />
            </svg>
          </span>
          Sitewell
        </Link>
      </div>
    </header>
  );
}
