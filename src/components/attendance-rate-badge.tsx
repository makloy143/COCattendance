import { Badge } from "@/components/ui/badge";
import {
  getAttendanceRateLabel,
  type AttendanceRate,
} from "@/lib/attendance-stats";
import { cn } from "@/lib/utils";

const RATE_STYLES: Record<AttendanceRate, string> = {
  1: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  2: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
  3: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  4: "border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-900 dark:bg-lime-950 dark:text-lime-300",
  5: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
};

export function AttendanceRateBadge({
  rate,
  rateLabel,
  className,
}: {
  rate: AttendanceRate | null;
  rateLabel?: string;
  className?: string;
}) {
  if (rate == null) {
    return (
      <Badge variant="outline" className={cn("font-normal", className)}>
        No rating yet
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", RATE_STYLES[rate], className)}
    >
      {rate}/5 · {rateLabel ?? getAttendanceRateLabel(rate)}
    </Badge>
  );
}
