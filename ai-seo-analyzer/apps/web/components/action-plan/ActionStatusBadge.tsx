import { Badge } from "@/components/ui/Badge";
import { ACTION_STATUS_META, type ActionStatus } from "@/lib/action-plan-types";

interface ActionStatusBadgeProps {
  status: ActionStatus;
}

/** Task 5: an action's status, always as a text label plus color - never color alone. */
export function ActionStatusBadge({ status }: ActionStatusBadgeProps) {
  const { label, tone } = ACTION_STATUS_META[status];
  return <Badge tone={tone}>{label}</Badge>;
}
