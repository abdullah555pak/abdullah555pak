import { seoReports } from "@/lib/data";

export default function SeoPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">SEO Performance</h1>
        <p className="text-sm text-secondary mt-1">
          Keyword rankings, organic traffic, and local pack visibility across
          client SEO &amp; Local SEO retainers.
        </p>
      </div>

      <div className="card overflow-x-auto min-w-0">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-[var(--border-hairline)] text-left text-xs text-muted">
              <th className="px-3 py-3 font-medium">Client</th>
              <th className="px-3 py-3 font-medium">Keywords Tracked</th>
              <th className="px-3 py-3 font-medium">Top 10 Rankings</th>
              <th className="px-3 py-3 font-medium">Organic Traffic</th>
              <th className="px-3 py-3 font-medium">Traffic Change</th>
              <th className="px-3 py-3 font-medium">Domain Authority</th>
              <th className="px-3 py-3 font-medium">Backlinks Gained</th>
              <th className="px-3 py-3 font-medium">Local Pack Rankings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gridline)]">
            {seoReports.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-3">
                  <div className="text-primary font-medium">{r.client}</div>
                  <div className="text-xs text-muted">{r.industry}</div>
                </td>
                <td className="px-3 py-3 tabular text-secondary">{r.keywordsTracked}</td>
                <td className="px-3 py-3 tabular text-secondary">{r.keywordsTop10}</td>
                <td className="px-3 py-3 tabular text-secondary">{r.organicTraffic.toLocaleString()}</td>
                <td
                  className={`px-3 py-3 tabular font-medium ${
                    r.trafficChangePct >= 0 ? "text-[var(--status-good)]" : "text-[var(--status-critical)]"
                  }`}
                >
                  {r.trafficChangePct >= 0 ? "+" : ""}
                  {r.trafficChangePct}%
                </td>
                <td className="px-3 py-3 tabular text-secondary">{r.domainAuthority}</td>
                <td className="px-3 py-3 tabular text-secondary">{r.backlinksGained}</td>
                <td className="px-3 py-3 tabular text-secondary">{r.localPackRankings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
