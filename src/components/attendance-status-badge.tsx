import { Badge } from "@/components/ui/badge";

type AttendanceStatus = "not_yet" | "in_only" | "complete";

export function getAttendanceStatus(
  timeIn: Date | string | null | undefined,
  timeOut: Date | string | null | undefined
): AttendanceStatus {
  if (!timeIn) return "not_yet";
  if (!timeOut) return "in_only";
  return "complete";
}

const statusConfig = {
  not_yet: {
    label: "Not yet",
    className: "bg-muted text-muted-foreground",
  },
  in_only: {
    label: "Timed in",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
  complete: {
    label: "Complete",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
};

export function AttendanceStatusBadge({
  timeIn,
  timeOut,
}: {
  timeIn?: Date | string | null;
  timeOut?: Date | string | null;
}) {
  const status = getAttendanceStatus(timeIn, timeOut);
  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
