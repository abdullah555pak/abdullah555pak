type Props = {
  label: string;
  value: string;
  delta?: string;
  deltaGood?: boolean;
};

export default function StatTile({ label, value, delta, deltaGood }: Props) {
  return (
    <div className="card px-5 py-4">
      <div className="text-xs text-secondary">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tabular text-primary">{value}</div>
      {delta && (
        <div
          className={`mt-1 text-xs tabular ${
            deltaGood ? "text-[var(--status-good)]" : "text-[var(--status-critical)]"
          }`}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
