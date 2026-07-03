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

export function formatDuration(
  timeIn: Date | string | null | undefined,
  timeOut: Date | string | null | undefined
): string {
  if (!timeIn || !timeOut) return "—";
  const start = new Date(timeIn).getTime();
  const end = new Date(timeOut).getTime();
  const minutes = Math.max(0, Math.floor((end - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}
