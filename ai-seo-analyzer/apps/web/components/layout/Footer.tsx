/**
 * No links to pages that don't exist yet (About/Privacy/Terms aren't
 * built) - a footer full of dead links would be worse than no footer.
 * Just the one honesty note carried over from the original homepage.
 */
export function Footer() {
  return (
    <footer className="border-t border-border">
      <p className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-muted">
        Sitewell is an early foundation build. No real website analysis, scores, or data are
        produced yet.
      </p>
    </footer>
  );
}
