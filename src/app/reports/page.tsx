import LineChart from "@/components/LineChart";
import BarChart from "@/components/BarChart";
import StatTile from "@/components/StatTile";
import { performanceHistory, clients } from "@/lib/data";

const currency = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

export default function ReportsPage() {
  const latest = performanceHistory[performanceHistory.length - 1];
  const prior = performanceHistory[performanceHistory.length - 2];
  const revenueDelta = (((latest.revenue - prior.revenue) / prior.revenue) * 100).toFixed(1);
  const retention = Math.round(
    (clients.filter((c) => c.churnRisk !== "High").length / clients.length) * 100
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-primary">Reporting</h1>
        <p className="text-sm text-secondary mt-1">
          Monthly performance across revenue, profit, lead volume, and client
          retention.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Revenue (this month)" value={currency(latest.revenue)} delta={`${revenueDelta}% MoM`} deltaGood={Number(revenueDelta) >= 0} />
        <StatTile label="Profit (this month)" value={currency(latest.profit)} delta={`${Math.round((latest.profit / latest.revenue) * 100)}% margin`} deltaGood />
        <StatTile label="Leads Generated" value={String(latest.leads)} delta="vs 6-month avg" deltaGood />
        <StatTile label="Client Retention" value={`${retention}%`} delta="Non high-risk accounts" deltaGood={retention >= 80} />
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-primary mb-4">Revenue &amp; Profit — 6 Month Trend</h2>
        <LineChart
          labels={performanceHistory.map((p) => p.label)}
          series={[
            { name: "Revenue", color: "var(--series-1)", values: performanceHistory.map((p) => p.revenue) },
            { name: "Profit", color: "var(--series-2)", values: performanceHistory.map((p) => p.profit) },
          ]}
          valueFormat="compactCurrency"
        />
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-primary mb-4">Lead Volume — 6 Month Trend</h2>
        <BarChart data={performanceHistory.map((p) => ({ label: p.label, value: p.leads }))} />
      </div>
    </div>
  );
}
