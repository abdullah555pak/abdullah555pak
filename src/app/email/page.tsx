import Badge from "@/components/Badge";
import { emailSequences } from "@/lib/data";

export default function EmailPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Email Marketing</h1>
        <p className="text-sm text-secondary mt-1">
          Automated sequences covering welcome, follow-up, nurture,
          re-engagement, and promotional campaigns.
        </p>
      </div>

      <div className="card overflow-x-auto min-w-0">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-[var(--border-hairline)] text-left text-xs text-muted">
              <th className="px-3 py-3 font-medium">Sequence</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Emails</th>
              <th className="px-3 py-3 font-medium">Open Rate</th>
              <th className="px-3 py-3 font-medium">Click Rate</th>
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gridline)]">
            {emailSequences.map((seq) => (
              <tr key={seq.id}>
                <td className="px-3 py-3 text-primary font-medium">{seq.name}</td>
                <td className="px-3 py-3 text-secondary">{seq.type}</td>
                <td className="px-3 py-3 tabular text-secondary">{seq.emails}</td>
                <td className="px-3 py-3 tabular text-secondary">{seq.openRate}%</td>
                <td className="px-3 py-3 tabular text-secondary">{seq.clickRate}%</td>
                <td className="px-3 py-3">
                  <Badge label={seq.active ? "Active" : "Paused"} tone={seq.active ? "good" : "neutral"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
