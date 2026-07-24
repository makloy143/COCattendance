import type {
  AttendanceRecord,
  StudentScheduleSlot,
} from "@/generated/prisma/client";
import {
  addManilaDays,
  formatManilaDateInput,
  getDurationMinutes,
  getManilaDayStart,
  getTodayStart,
} from "@/lib/date-utils";
import { evaluateStudentScheduleStatus } from "@/lib/schedule-monitoring-shared";

export const REQUIRED_DUTY_HOURS = 80;
export const REQUIRED_DUTY_MINUTES = REQUIRED_DUTY_HOURS * 60;

export type AttendanceRate = 1 | 2 | 3 | 4 | 5;

export type StudentAttendanceStats = {
  lateCount: number;
  absentCount: number;
  onTimeCount: number;
  presentCount: number;
  scheduledDays: number;
  totalMinutes: number;
  hoursCompleted: number;
  hoursRemaining: number;
  dutyProgressPercent: number;
  rate: AttendanceRate | null;
  rateLabel: string;
};

const RATE_LABELS: Record<AttendanceRate, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export function getAttendanceRateLabel(rate: AttendanceRate | null): string {
  if (rate == null) return "No rating yet";
  return RATE_LABELS[rate];
}

/**
 * Rate 1–5 from present + on-time duty days.
 * On-time days count fully; late days count half; absences count zero.
 */
export function computeAttendanceRate(
  onTimeCount: number,
  lateCount: number,
  scheduledDays: number
): AttendanceRate | null {
  if (scheduledDays <= 0) return null;

  const score = (onTimeCount + lateCount * 0.5) / scheduledDays;
  const rate = Math.max(1, Math.min(5, Math.round(score * 5)));
  return rate as AttendanceRate;
}

export function computeStudentAttendanceStats(
  slots: Pick<
    StudentScheduleSlot,
    "dayOfWeek" | "startTime" | "endTime" | "isEnabled"
  >[],
  attendanceRecords: Pick<
    AttendanceRecord,
    "date" | "timeIn" | "timeOut"
  >[],
  options?: {
    createdAt?: Date | string;
    now?: Date;
  }
): StudentAttendanceStats {
  const now = options?.now ?? new Date();
  const todayStart = getTodayStart(now);
  const startDate = getManilaDayStart(options?.createdAt ?? todayStart);

  const attendanceByDate = new Map<
    string,
    Pick<AttendanceRecord, "date" | "timeIn" | "timeOut">
  >();
  let totalMinutes = 0;

  for (const record of attendanceRecords) {
    attendanceByDate.set(formatManilaDateInput(record.date), record);
    totalMinutes += getDurationMinutes(record.timeIn, record.timeOut);
  }

  let lateCount = 0;
  let absentCount = 0;
  let onTimeCount = 0;
  let scheduledDays = 0;

  const hasEnabledSlots = slots.some((slot) => slot.isEnabled);

  if (hasEnabledSlots && startDate.getTime() <= todayStart.getTime()) {
    for (
      let cursor = startDate;
      cursor.getTime() <= todayStart.getTime();
      cursor = addManilaDays(cursor, 1)
    ) {
      const dateKey = formatManilaDateInput(cursor);
      const attendance = attendanceByDate.get(dateKey) ?? null;
      const { status } = evaluateStudentScheduleStatus(
        slots,
        attendance,
        cursor,
        now
      );

      if (
        status === "OFF_DUTY" ||
        status === "UPCOMING" ||
        status === "WAITING"
      ) {
        continue;
      }

      scheduledDays += 1;

      if (status === "LATE") {
        lateCount += 1;
      } else if (status === "ABSENT") {
        absentCount += 1;
      } else if (status === "ON_TIME" || status === "COMPLETED") {
        onTimeCount += 1;
      }
    }
  }

  const presentCount = onTimeCount + lateCount;
  const hoursCompleted = Math.round((totalMinutes / 60) * 10) / 10;
  const hoursRemaining = Math.max(
    0,
    Math.round((REQUIRED_DUTY_MINUTES - totalMinutes) / 60 * 10) / 10
  );
  const dutyProgressPercent = Math.min(
    100,
    Math.round((totalMinutes / REQUIRED_DUTY_MINUTES) * 100)
  );
  const rate = computeAttendanceRate(onTimeCount, lateCount, scheduledDays);

  return {
    lateCount,
    absentCount,
    onTimeCount,
    presentCount,
    scheduledDays,
    totalMinutes,
    hoursCompleted,
    hoursRemaining,
    dutyProgressPercent,
    rate,
    rateLabel: getAttendanceRateLabel(rate),
  };
}
