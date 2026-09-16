export default function ScoreMeter({ value, width = 88 }: { value: number; width?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 75 ? "var(--series-1)" : pct >= 45 ? "var(--seq-250)" : "var(--baseline)";

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 rounded-full bg-[var(--gridline)] overflow-hidden"
        style={{ width }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs tabular text-secondary w-6 text-right">{pct}</span>
    </div>
  );
}
