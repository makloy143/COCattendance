import { Badge } from "@/components/ui/badge";
import {
  MAINTENANCE_PRIORITY_LABELS,
  type MaintenancePriorityValue,
} from "@/lib/maintenance-shared";
import { cn } from "@/lib/utils";

const priorityClassName: Record<MaintenancePriorityValue, string> = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function MaintenancePriorityBadge({
  priority,
}: {
  priority: MaintenancePriorityValue;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("whitespace-nowrap", priorityClassName[priority])}
    >
      {MAINTENANCE_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
