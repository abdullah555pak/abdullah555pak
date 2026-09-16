type Tone = "good" | "warning" | "serious" | "critical" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  good: "text-[var(--status-good)] bg-[var(--status-good)]/10",
  warning: "text-[var(--status-warning)] bg-[var(--status-warning)]/15",
  serious: "text-[var(--status-serious)] bg-[var(--status-serious)]/15",
  critical: "text-[var(--status-critical)] bg-[var(--status-critical)]/10",
  neutral: "text-secondary bg-[var(--gridline)]/50",
};

const ICONS: Record<Tone, string> = {
  good: "●",
  warning: "▲",
  serious: "▲",
  critical: "●",
  neutral: "○",
};

export function riskTone(risk: "Low" | "Medium" | "High"): Tone {
  if (risk === "Low") return "good";
  if (risk === "Medium") return "warning";
  return "critical";
}

export default function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_STYLES[tone]}`}
    >
      <span aria-hidden="true" className="text-[10px]">
        {ICONS[tone]}
      </span>
      {label}
    </span>
  );
}
