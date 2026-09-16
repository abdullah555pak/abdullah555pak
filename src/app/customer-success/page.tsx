import Badge, { riskTone } from "@/components/Badge";
import ScoreMeter from "@/components/ScoreMeter";
import { customerSuccessSignals } from "@/lib/data";

export default function CustomerSuccessPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Customer Success</h1>
        <p className="text-sm text-secondary mt-1">
          Satisfaction signals, churn risk, and upsell/cross-sell opportunities
          across the active client base.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {customerSuccessSignals.map((s) => (
          <div key={s.client} className="card p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm font-semibold text-primary">{s.client}</div>
                <Badge label={`${s.churnRisk} churn risk`} tone={riskTone(s.churnRisk)} />
              </div>
              <div className="text-xs text-muted mt-0.5">Last check-in {s.lastCheckIn}</div>
              <p className="text-sm text-secondary mt-2">{s.note}</p>
              {s.upsellOpportunity && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--series-1)] font-medium">
                  ↑ Opportunity: {s.upsellOpportunity}
                </div>
              )}
            </div>
            <div className="md:w-48 shrink-0">
              <div className="text-xs text-muted mb-1">Satisfaction</div>
              <ScoreMeter value={s.satisfaction} width={120} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
