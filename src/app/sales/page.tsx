import { deals, objections } from "@/lib/data";
import type { PipelineStage } from "@/lib/types";

const STAGES: PipelineStage[] = [
  "New",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
];

const currency = (n: number) => `$${n.toLocaleString()}`;

export default function SalesPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-primary">Sales Pipeline</h1>
        <p className="text-sm text-secondary mt-1">
          Deal flow from first touch to close, with live objection tracking so
          reps always have the right response on hand.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          const total = stageDeals.reduce((sum, d) => sum + d.value, 0);
          return (
            <div key={stage} className="card p-3 flex flex-col gap-2 min-h-[140px]">
              <div className="text-xs font-medium text-secondary flex items-center justify-between">
                {stage}
                <span className="text-muted">{stageDeals.length}</span>
              </div>
              <div className="text-sm font-semibold tabular text-primary">
                {currency(total)}
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {stageDeals.map((d) => (
                  <div key={d.id} className="rounded-lg border border-[var(--border-hairline)] px-2.5 py-2">
                    <div className="text-xs font-medium text-primary truncate">{d.businessName}</div>
                    <div className="text-xs text-muted tabular">{currency(d.value)}</div>
                    <div className="text-[11px] text-muted mt-0.5">{d.owner} · {d.lastActivity}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-primary mb-1">Objection Handling Playbook</h2>
        <p className="text-xs text-secondary mb-4">
          Persuasive, human-like responses ready for reps on every common objection.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objections.map((o) => (
            <div key={o.objection} className="rounded-lg border border-[var(--border-hairline)] p-4">
              <div className="text-sm font-medium text-primary mb-1.5">
                &ldquo;{o.objection}&rdquo;
              </div>
              <p className="text-sm text-secondary">{o.response}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
