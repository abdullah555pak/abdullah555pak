import Badge, { riskTone } from "@/components/Badge";
import { clients } from "@/lib/data";

const currency = (n: number) => `$${n.toLocaleString()}`;

export default function ClientsPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Clients &amp; Onboarding</h1>
        <p className="text-sm text-secondary mt-1">
          Active accounts, health scores, and onboarding progress from
          contract signature to first performance review.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {clients.map((c) => {
          const completed = c.onboarding.filter((s) => s.done).length;
          return (
            <div key={c.id} className="card p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-sm font-semibold text-primary">{c.businessName}</div>
                  <Badge label={`${c.churnRisk} churn risk`} tone={riskTone(c.churnRisk)} />
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {c.industry} · {c.plan} · CSM {c.csm} · Started {c.startDate}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {c.onboarding.map((step) => (
                    <span
                      key={step.label}
                      className={`text-xs rounded-full px-2.5 py-1 border ${
                        step.done
                          ? "border-transparent bg-[var(--status-good)]/10 text-[var(--status-good)]"
                          : "border-[var(--border-hairline)] text-muted"
                      }`}
                    >
                      {step.done ? "✓" : "○"} {step.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex md:flex-col gap-4 md:gap-1 md:text-right md:w-40 shrink-0">
                <div>
                  <div className="text-xs text-muted">MRR</div>
                  <div className="text-sm font-semibold tabular text-primary">{currency(c.mrr)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Health Score</div>
                  <div className="text-sm font-semibold tabular text-primary">{c.healthScore}/100</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Onboarding</div>
                  <div className="text-sm font-semibold tabular text-primary">
                    {completed}/{c.onboarding.length}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
