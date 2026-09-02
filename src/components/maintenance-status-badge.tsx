import { Badge } from "@/components/ui/badge";
import {
  MAINTENANCE_STATUS_LABELS,
  type MaintenanceStatusValue,
} from "@/lib/maintenance-shared";
import { cn } from "@/lib/utils";

const statusClassName: Record<MaintenanceStatusValue, string> = {
  OPEN: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  DIAGNOSING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  UNDER_REPAIR:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  AWAITING_PARTS:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  AWAITING_VENDOR:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  COMPLETED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  UNREPAIRABLE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  CANCELLED:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function MaintenanceStatusBadge({
  status,
}: {
  status: MaintenanceStatusValue;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("whitespace-nowrap", statusClassName[status])}
    >
      {MAINTENANCE_STATUS_LABELS[status]}
    </Badge>
  );
}
