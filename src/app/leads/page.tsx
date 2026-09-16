import ScoreMeter from "@/components/ScoreMeter";
import { leads } from "@/lib/data";

const currency = (n: number) => `$${n.toLocaleString()}`;

export default function LeadsPage() {
  const sorted = [...leads].sort((a, b) => b.opportunityScore - a.opportunityScore);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Lead Generation</h1>
        <p className="text-sm text-secondary mt-1">
          Prospects identified across target industries — scored by weakness of
          current marketing (lower marketing score = bigger opportunity) and
          overall deal opportunity, ranked for outreach priority.
        </p>
      </div>

      <div className="card overflow-x-auto min-w-0">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--border-hairline)] text-left text-xs text-muted">
              <th className="px-3 py-3 font-medium">Business</th>
              <th className="px-3 py-3 font-medium">Industry / Location</th>
              <th className="px-3 py-3 font-medium">Contact</th>
              <th className="px-3 py-3 font-medium">Est. Revenue</th>
              <th className="px-3 py-3 font-medium">Marketing Score</th>
              <th className="px-3 py-3 font-medium">Opportunity</th>
              <th className="px-3 py-3 font-medium">Recommended Service</th>
              <th className="px-3 py-3 font-medium">Est. Deal Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gridline)]">
            {sorted.map((l) => (
              <tr key={l.id}>
                <td className="px-3 py-3">
                  <div className="text-primary font-medium">{l.businessName}</div>
                  <div className="text-xs text-muted">{l.ownerName}</div>
                </td>
                <td className="px-3 py-3 text-secondary">
                  {l.industry}
                  <div className="text-xs text-muted">{l.location}</div>
                </td>
                <td className="px-3 py-3 text-secondary">
                  <div className="text-xs">{l.email}</div>
                  <div className="text-xs text-muted">{l.phone}</div>
                </td>
                <td className="px-3 py-3 tabular text-secondary">
                  {currency(l.monthlyRevenueEstimate)}/mo
                </td>
                <td className="px-3 py-3">
                  <ScoreMeter value={l.marketingScore} width={64} />
                </td>
                <td className="px-3 py-3">
                  <ScoreMeter value={l.opportunityScore} width={64} />
                </td>
                <td className="px-3 py-3 text-secondary">{l.recommendedService}</td>
                <td className="px-3 py-3 tabular text-primary font-medium whitespace-nowrap">
                  {currency(l.estimatedDealValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
