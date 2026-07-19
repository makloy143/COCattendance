export const APP_TIMEZONE = "Asia/Manila";

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function getManilaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

/** Calendar date in Manila as `yyyy-MM-dd`. */
export function formatManilaDateInput(date: Date | string = new Date()): string {
  const { year, month, day } = getManilaParts(toDate(date));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Start of a Manila calendar day (midnight PH / UTC+8). */
export function getManilaDayStart(date: Date | string = new Date()): Date {
  const dateKey =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : formatManilaDateInput(date);
  return new Date(`${dateKey}T00:00:00+08:00`);
}

/** End of a Manila calendar day (23:59:59.999 PH). */
export function getManilaDayEnd(date: Date | string = new Date()): Date {
  const dateKey =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : formatManilaDateInput(date);
  return new Date(`${dateKey}T23:59:59.999+08:00`);
}

/** Midnight today in Manila — used as the attendance day key. */
export function getTodayStart(now: Date = new Date()): Date {
  return getManilaDayStart(now);
}

const MANILA_WEEKDAY_MAP: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/** ISO-style weekday in Manila: Monday = 1, Sunday = 7. */
export function getManilaDayOfWeek(date: Date | string = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  }).format(toDate(date));
  return MANILA_WEEKDAY_MAP[weekday] ?? 1;
}

export function combineManilaDateAndTime(
  date: Date | string,
  time: string
): Date {
  const dateKey = formatManilaDateInput(date);
  const normalizedTime = time.match(/^\d{2}:\d{2}$/)
    ? time
    : `${time.padStart(5, "0").slice(0, 5)}`;
  return new Date(`${dateKey}T${normalizedTime}:00+08:00`);
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: APP_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(toDate(date));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(toDate(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(toDate(date));
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

/** Monday 00:00 Manila for the week containing `date` (Mon–Sun weeks). */
export function getManilaWeekStart(date: Date | string = new Date()): Date {
  const dayStart = getManilaDayStart(date);
  const dayOfWeek = getManilaDayOfWeek(dayStart);
  const daysFromMonday = dayOfWeek === 7 ? 6 : dayOfWeek - 1;
  return new Date(dayStart.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
}

/** Add whole calendar days in Manila (preserves the yyyy-MM-dd key). */
export function addManilaDays(date: Date | string, days: number): Date {
  const dayStart = getManilaDayStart(date);
  return new Date(dayStart.getTime() + days * 24 * 60 * 60 * 1000);
}

/** ISO-style week number in Manila (weeks start Monday). */
export function getManilaWeekNumber(date: Date | string = new Date()): number {
  const weekStart = getManilaWeekStart(date);
  const { year } = getManilaParts(weekStart);
  const jan4 = getManilaDayStart(`${year}-01-04`);
  const week1Start = getManilaWeekStart(jan4);
  const diffMs = weekStart.getTime() - week1Start.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
}

export function formatManilaMonthYear(date: Date | string = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(toDate(date));
}
