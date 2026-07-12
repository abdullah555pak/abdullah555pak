import Badge from "@/components/Badge";
import { contentCalendar } from "@/lib/data";

const STATUS_TONE = {
  Published: "good",
  Scheduled: "neutral",
  "In Production": "warning",
  Planned: "neutral",
} as const;

export default function SocialPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Social Media Management</h1>
        <p className="text-sm text-secondary mt-1">
          30-day content calendar spanning Reels, Carousels, Stories, and static
          posts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentCalendar.map((item) => (
          <div key={item.day} className="card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Day {item.day}</span>
              <Badge label={item.status} tone={STATUS_TONE[item.status]} />
            </div>
            <div className="text-xs font-medium text-secondary">{item.type}</div>
            <div className="text-sm text-primary">{item.topic}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
