import type {
  AttendanceRecord,
  Department,
  StudentScheduleSlot,
} from "@/generated/prisma/client";
import {
  combineManilaDateAndTime,
  formatManilaDateInput,
  getManilaDayEnd,
  getManilaDayOfWeek,
  getManilaDayStart,
} from "@/lib/date-utils";
import { getDepartmentLabel } from "@/lib/departments";
import { formatScheduleTime, getWeekdayLabel } from "@/lib/schedule";
import {
  getStudentAssignmentLabel,
  type StudentAssignment,
} from "@/lib/student-assignment";
import { getStudentTypeLabel, type StudentType } from "@/lib/student-type";

export const LATE_GRACE_MINUTES = 15;

export type ScheduleDutyStatus =
  | "OFF_DUTY"
  | "UPCOMING"
  | "WAITING"
  | "ON_TIME"
  | "LATE"
  | "ABSENT"
  | "COMPLETED";

export type WeeklyScheduleEntry = {
  dayOfWeek: number;
  dayLabel: string;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
  displayTime: string;
};

export type StudentScheduleMonitorRow = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  studentType: StudentType;
  assignment: StudentAssignment;
  department: Department;
  dutyDaysLabel: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  scheduledStartDisplay: string | null;
  scheduledEndDisplay: string | null;
  timeIn: Date | null;
  timeOut: Date | null;
  timeInDisplay: string;
  status: ScheduleDutyStatus;
  minutesLate: number | null;
  recommendation: string | null;
  weeklySchedule: WeeklyScheduleEntry[];
};

export type ScheduleMonitoringSummary = {
  date: string;
  dayLabel: string;
  totalActiveStudents: number;
  scheduledToday: number;
  offDutyToday: number;
  onTime: number;
  late: number;
  absent: number;
  waiting: number;
  upcoming: number;
  completed: number;
  noScheduleConfigured: number;
};

export type ScheduleMonitoringData = {
  summary: ScheduleMonitoringSummary;
  recommendations: StudentScheduleMonitorRow[];
  students: StudentScheduleMonitorRow[];
};

function getReferenceNow(viewDate: Date, now: Date = new Date()): Date {
  const todayKey = formatManilaDateInput(now);
  const viewKey = formatManilaDateInput(viewDate);

  if (viewKey < todayKey) {
    return getManilaDayEnd(viewDate);
  }

  if (viewKey > todayKey) {
    return getManilaDayStart(viewDate);
  }

  return now;
}

export function evaluateStudentScheduleStatus(
  slots: Pick<
    StudentScheduleSlot,
    "dayOfWeek" | "startTime" | "endTime" | "isEnabled"
  >[],
  attendance: Pick<AttendanceRecord, "timeIn" | "timeOut"> | null,
  viewDate: Date,
  now: Date = new Date()
): {
  status: ScheduleDutyStatus;
  slot: StudentScheduleSlot | null;
  minutesLate: number | null;
} {
  const dayOfWeek = getManilaDayOfWeek(viewDate);
  const slot =
    slots.find((entry) => entry.dayOfWeek === dayOfWeek && entry.isEnabled) ??
    null;

  if (!slot) {
    return { status: "OFF_DUTY", slot: null, minutesLate: null };
  }

  const referenceNow = getReferenceNow(viewDate, now);
  const scheduledStart = combineManilaDateAndTime(viewDate, slot.startTime);
  const scheduledEnd = combineManilaDateAndTime(viewDate, slot.endTime);
  const graceEnd = new Date(
    scheduledStart.getTime() + LATE_GRACE_MINUTES * 60 * 1000
  );

  if (attendance?.timeIn) {
    const timeIn = new Date(attendance.timeIn);
    const minutesLate = Math.max(
      0,
      Math.floor((timeIn.getTime() - scheduledStart.getTime()) / 60000)
    );

    if (attendance.timeOut) {
      return {
        status: minutesLate > LATE_GRACE_MINUTES ? "LATE" : "COMPLETED",
        slot: slot as StudentScheduleSlot,
        minutesLate: minutesLate > LATE_GRACE_MINUTES ? minutesLate : null,
      };
    }

    if (timeIn.getTime() > graceEnd.getTime()) {
      return {
        status: "LATE",
        slot: slot as StudentScheduleSlot,
        minutesLate,
      };
    }

    return {
      status: "ON_TIME",
      slot: slot as StudentScheduleSlot,
      minutesLate: null,
    };
  }

  if (referenceNow.getTime() < scheduledStart.getTime()) {
    return {
      status: "UPCOMING",
      slot: slot as StudentScheduleSlot,
      minutesLate: null,
    };
  }

  if (referenceNow.getTime() < graceEnd.getTime()) {
    return {
      status: "WAITING",
      slot: slot as StudentScheduleSlot,
      minutesLate: null,
    };
  }

  if (referenceNow.getTime() <= scheduledEnd.getTime()) {
    return {
      status: "ABSENT",
      slot: slot as StudentScheduleSlot,
      minutesLate: null,
    };
  }

  return {
    status: "ABSENT",
    slot: slot as StudentScheduleSlot,
    minutesLate: null,
  };
}

export function getScheduleStatusLabel(status: ScheduleDutyStatus): string {
  const labels: Record<ScheduleDutyStatus, string> = {
    OFF_DUTY: "Off Duty",
    UPCOMING: "Upcoming",
    WAITING: "Waiting",
    ON_TIME: "On Time",
    LATE: "Late",
    ABSENT: "Absent",
    COMPLETED: "Completed",
  };
  return labels[status];
}

export function formatStudentScheduleSummary(
  row: StudentScheduleMonitorRow
): string {
  if (!row.weeklySchedule.some((slot) => slot.isEnabled)) {
    return "No duty schedule configured";
  }

  const enabledDays = row.weeklySchedule
    .filter((slot) => slot.isEnabled)
    .map((slot) => `${slot.dayLabel} ${slot.displayTime}`)
    .join(" · ");

  return `${enabledDays} · ${getStudentTypeLabel(row.studentType)} · ${getDepartmentLabel(row.department)}`;
}
