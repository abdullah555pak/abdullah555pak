import StatTile from "@/components/StatTile";
import LineChart from "@/components/LineChart";
import BarChart from "@/components/BarChart";
import Badge, { riskTone } from "@/components/Badge";
import ScoreMeter from "@/components/ScoreMeter";
import { kpis, leads, performanceHistory, customerSuccessSignals } from "@/lib/data";

const currency = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

export default function OverviewPage() {
  const topLeads = [...leads].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 5);
  const atRisk = customerSuccessSignals.filter((c) => c.churnRisk !== "Low");

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-primary">Agency Overview</h1>
        <p className="text-sm text-secondary mt-1">
          Live executive summary across sales, delivery, and retention — decisions
          prioritized by revenue growth, profitability, automation, retention, and
          scalability.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Monthly Recurring Revenue" value={currency(kpis.mrr)} delta="+8.6% vs last month" deltaGood />
        <StatTile label="Active Clients" value={String(kpis.activeClients)} delta={`${kpis.churnRiskClients} at high churn risk`} deltaGood={kpis.churnRiskClients === 0} />
        <StatTile label="Open Pipeline Value" value={currency(kpis.pipelineValue)} delta={`${currency(kpis.wonThisMonth)} won this month`} deltaGood />
        <StatTile label="Blended ROAS" value={`${kpis.blendedRoas}x`} delta="Across active ad accounts" deltaGood />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-primary">Revenue &amp; Profit Trend</h2>
          <span className="text-xs text-muted">Last 6 months</span>
        </div>
        <LineChart
          labels={performanceHistory.map((p) => p.label)}
          series={[
            { name: "Revenue", color: "var(--series-1)", values: performanceHistory.map((p) => p.revenue) },
            { name: "Profit", color: "var(--series-2)", values: performanceHistory.map((p) => p.profit) },
          ]}
          valueFormat="compactCurrency"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-primary">Leads Generated</h2>
            <span className="text-xs text-muted">Last 6 months</span>
          </div>
          <BarChart
            data={performanceHistory.map((p) => ({ label: p.label, value: p.leads }))}
            color="var(--series-1)"
          />
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-primary mb-4">Top Prospects Right Now</h2>
          <div className="flex flex-col gap-3">
            {topLeads.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-primary truncate">{l.businessName}</div>
                  <div className="text-xs text-muted truncate">
                    {l.industry} · {l.location}
                  </div>
                </div>
                <ScoreMeter value={l.opportunityScore} width={64} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-primary mb-4">Clients Needing Attention</h2>
        <div className="flex flex-col divide-y divide-[var(--gridline)]">
          {atRisk.map((c) => (
            <div key={c.client} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-primary truncate">{c.client}</div>
                <div className="text-xs text-muted truncate">{c.note}</div>
              </div>
              <Badge label={`${c.churnRisk} churn risk`} tone={riskTone(c.churnRisk)} />
            </div>
          ))}
          {atRisk.length === 0 && (
            <div className="py-3 text-sm text-secondary">No clients currently at risk.</div>
          )}
        </div>
      </div>
    </div>
  );
}
