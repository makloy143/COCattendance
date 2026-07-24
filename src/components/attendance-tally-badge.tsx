import { Clock, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AttendanceTallyKind = "late" | "absent";

const TALLY_CONFIG = {
  late: {
    label: "Late",
    Icon: Clock,
    active:
      "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200",
    inactive:
      "border-transparent bg-muted/60 text-muted-foreground",
  },
  absent: {
    label: "Absent",
    Icon: UserX,
    active:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
    inactive:
      "border-transparent bg-muted/60 text-muted-foreground",
  },
} as const;

export function AttendanceTallyBadge({
  kind,
  count,
  showLabel = true,
  className,
}: {
  kind: AttendanceTallyKind;
  count: number;
  showLabel?: boolean;
  className?: string;
}) {
  const config = TALLY_CONFIG[kind];
  const isActive = count > 0;
  const Icon = config.Icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1 px-2 font-semibold tabular-nums",
        isActive ? config.active : config.inactive,
        className
      )}
      title={`${count} ${config.label.toLowerCase()}`}
    >
      <Icon
        className={cn(
          "size-3!",
          isActive && kind === "late" && "text-orange-600 dark:text-orange-300",
          isActive && kind === "absent" && "text-red-600 dark:text-red-300"
        )}
      />
      {showLabel ? (
        <span className="font-medium tracking-tight">
          {config.label}
          <span className="mx-1 opacity-40">·</span>
          <span className="tabular-nums">{count}</span>
        </span>
      ) : (
        <span className="min-w-3 text-center tabular-nums">{count}</span>
      )}
    </Badge>
  );
}

export function AttendanceTallyPair({
  lateCount,
  absentCount,
  compact = false,
  className,
}: {
  lateCount: number;
  absentCount: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <AttendanceTallyBadge
        kind="late"
        count={lateCount}
        showLabel={!compact}
      />
      <AttendanceTallyBadge
        kind="absent"
        count={absentCount}
        showLabel={!compact}
      />
    </div>
  );
}
