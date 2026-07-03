export type ScheduleSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
};

export const WEEKDAY_LABELS: { dayOfWeek: number; label: string }[] = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
];

export function createDefaultSchedule(): ScheduleSlot[] {
  return WEEKDAY_LABELS.map(({ dayOfWeek }) => ({
    dayOfWeek,
    startTime: "08:00",
    endTime: "17:00",
    isEnabled: true,
  }));
}

export function normalizeTimeString(time: string): string {
  const trimmed = time.trim();
  if (!trimmed) return "08:00";

  const twentyFourHourWithSeconds = trimmed.match(/^(\d{1,2}):(\d{2}):\d{2}$/);
  if (twentyFourHourWithSeconds) {
    return `${twentyFourHourWithSeconds[1].padStart(2, "0")}:${twentyFourHourWithSeconds[2]}`;
  }

  const twentyFourHour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    return `${twentyFourHour[1].padStart(2, "0")}:${twentyFourHour[2]}`;
  }

  const twelveHour = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hours = Number(twelveHour[1]);
    const minutes = twelveHour[2];
    const period = twelveHour[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  return trimmed;
}

export function normalizeScheduleSlot(
  slot: Partial<ScheduleSlot> & { dayOfWeek?: number | string }
): ScheduleSlot {
  return {
    dayOfWeek: Number(slot.dayOfWeek),
    startTime: normalizeTimeString(String(slot.startTime ?? "08:00")),
    endTime: normalizeTimeString(String(slot.endTime ?? "17:00")),
    isEnabled: Boolean(slot.isEnabled),
  };
}

export function normalizeScheduleSlots(slots: ScheduleSlot[]): ScheduleSlot[] {
  return mergeScheduleWithDefaults(slots.map(normalizeScheduleSlot));
}

export function mergeScheduleWithDefaults(
  slots: Pick<ScheduleSlot, "dayOfWeek" | "startTime" | "endTime" | "isEnabled">[]
): ScheduleSlot[] {
  return createDefaultSchedule().map((defaultSlot) => {
    const saved = slots.find(
      (slot) => Number(slot.dayOfWeek) === defaultSlot.dayOfWeek
    );
    return saved
      ? normalizeScheduleSlot({ ...defaultSlot, ...saved })
      : { ...defaultSlot, isEnabled: false };
  });
}

export function formatScheduleTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function getWeekdayLabel(dayOfWeek: number): string {
  return WEEKDAY_LABELS.find((day) => day.dayOfWeek === dayOfWeek)?.label ?? "";
}
