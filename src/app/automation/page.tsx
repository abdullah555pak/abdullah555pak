import Badge from "@/components/Badge";
import { integrations } from "@/lib/data";

export default function AutomationPage() {
  const connected = integrations.filter((i) => i.status === "Connected").length;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">AI Automation</h1>
        <p className="text-sm text-secondary mt-1">
          Integrations powering automated lead capture, CRM updates,
          appointment booking, follow-ups, and reporting — {connected}/
          {integrations.length} connected.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((i) => (
          <div key={i.name} className="card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-primary">{i.name}</div>
              <Badge label={i.status} tone={i.status === "Connected" ? "good" : "neutral"} />
            </div>
            <div className="text-xs text-muted">{i.category}</div>
            <div className="text-xs text-secondary">{i.syncing}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-primary mb-3">Automated Workflows</h2>
        <ul className="text-sm text-secondary list-disc list-inside space-y-1.5">
          <li>New lead captured → scored → routed to CRM → sales rep notified in Slack.</li>
          <li>Appointment booked → confirmation SMS + calendar invite sent automatically.</li>
          <li>No-show detected → automated re-engagement SMS + follow-up task created.</li>
          <li>Invoice paid in Stripe → client marked active → onboarding sequence triggered.</li>
          <li>Client health score drops below 50 → Customer Success alerted same day.</li>
          <li>Weekly performance report generated and emailed every Monday 8am.</li>
        </ul>
      </div>
    </div>
  );
}
