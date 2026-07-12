export default function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-surface px-4 md:px-8 py-3.5">
      <div>
        <div className="text-sm font-semibold text-primary">
          BrandSkull Marketing Agency
        </div>
        <div className="text-xs text-muted">
          United States · Canada · United Kingdom · Australia · Europe
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-xs text-secondary">
          Chief AI Operating Officer — live
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--status-good)]/10 px-2.5 py-1 text-xs font-medium text-[var(--status-good)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-good)]" />
          All systems operating
        </span>
      </div>
    </header>
  );
}
