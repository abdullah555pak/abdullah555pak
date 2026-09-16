import Badge from "@/components/Badge";
import { campaigns } from "@/lib/data";

const currency = (n: number) => `$${n.toLocaleString()}`;

const STATUS_TONE = {
  Active: "good",
  Paused: "critical",
  Learning: "warning",
} as const;

export default function CampaignsPage() {
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const blendedRoas =
    Math.round((campaigns.reduce((s, c) => s + c.roas * c.spend, 0) / totalSpend) * 10) / 10;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Ad Campaigns</h1>
        <p className="text-sm text-secondary mt-1">
          Facebook &amp; Google Ads performance across all managed accounts.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card px-5 py-4">
          <div className="text-xs text-secondary">Total Spend (30d)</div>
          <div className="mt-1.5 text-2xl font-semibold tabular text-primary">{currency(totalSpend)}</div>
        </div>
        <div className="card px-5 py-4">
          <div className="text-xs text-secondary">Leads Generated</div>
          <div className="mt-1.5 text-2xl font-semibold tabular text-primary">{totalLeads}</div>
        </div>
        <div className="card px-5 py-4">
          <div className="text-xs text-secondary">Blended ROAS</div>
          <div className="mt-1.5 text-2xl font-semibold tabular text-primary">{blendedRoas}x</div>
        </div>
        <div className="card px-5 py-4">
          <div className="text-xs text-secondary">Active Campaigns</div>
          <div className="mt-1.5 text-2xl font-semibold tabular text-primary">
            {campaigns.filter((c) => c.status === "Active").length}
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto min-w-0">
        <table className="w-full text-sm min-w-[980px]">
          <thead>
            <tr className="border-b border-[var(--border-hairline)] text-left text-xs text-muted">
              <th className="px-3 py-3 font-medium">Campaign</th>
              <th className="px-3 py-3 font-medium">Platform</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Spend</th>
              <th className="px-3 py-3 font-medium">Leads</th>
              <th className="px-3 py-3 font-medium">CPL</th>
              <th className="px-3 py-3 font-medium">CPA</th>
              <th className="px-3 py-3 font-medium">ROAS</th>
              <th className="px-3 py-3 font-medium">CTR</th>
              <th className="px-3 py-3 font-medium">CPC</th>
              <th className="px-3 py-3 font-medium">Conv. Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gridline)]">
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-3">
                  <div className="text-primary font-medium">{c.name}</div>
                  <div className="text-xs text-muted">{c.client}</div>
                </td>
                <td className="px-3 py-3 text-secondary">{c.platform}</td>
                <td className="px-3 py-3">
                  <Badge label={c.status} tone={STATUS_TONE[c.status]} />
                </td>
                <td className="px-3 py-3 tabular text-secondary">{currency(c.spend)}</td>
                <td className="px-3 py-3 tabular text-secondary">{c.leads}</td>
                <td className="px-3 py-3 tabular text-secondary">${c.cpl.toFixed(1)}</td>
                <td className="px-3 py-3 tabular text-secondary">${c.cpa.toFixed(1)}</td>
                <td className="px-3 py-3 tabular text-primary font-medium">{c.roas.toFixed(1)}x</td>
                <td className="px-3 py-3 tabular text-secondary">{c.ctr.toFixed(1)}%</td>
                <td className="px-3 py-3 tabular text-secondary">${c.cpc.toFixed(2)}</td>
                <td className="px-3 py-3 tabular text-secondary">{c.conversionRate.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
