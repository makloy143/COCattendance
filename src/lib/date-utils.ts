import { format, startOfDay } from "date-fns";

export function getTodayStart(): Date {
  return startOfDay(new Date());
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "h:mm a");
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function getDurationMinutes(
  timeIn: Date | string | null | undefined,
  timeOut: Date | string | null | undefined
): number {
  if (!timeIn || !timeOut) return 0;
  const start = new Date(timeIn).getTime();
  const end = new Date(timeOut).getTime();
  return Math.max(0, Math.floor((end - start) / 60000));
}

export function getTotalMinutes(
  records: {
    timeIn: Date | string | null | undefined;
    timeOut: Date | string | null | undefined;
  }[]
): number {
  return records.reduce(
    (total, record) => total + getDurationMinutes(record.timeIn, record.timeOut),
    0
  );
}

export function formatTotalHours(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min";
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

export function formatDuration(
  timeIn: Date | string | null | undefined,
  timeOut: Date | string | null | undefined
): string {
  if (!timeIn || !timeOut) return "—";
  return formatTotalHours(getDurationMinutes(timeIn, timeOut));
}
