import type {
  AttendanceRecord,
  Department,
  Student,
  StudentScheduleSlot,
} from "@/generated/prisma/client";
import { getStudentDepartmentFilter, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  combineManilaDateAndTime,
  formatManilaDateInput,
  formatTime,
  getManilaDayEnd,
  getManilaDayOfWeek,
  getManilaDayStart,
  getTodayStart,
} from "@/lib/date-utils";
import { getDepartmentLabel } from "@/lib/departments";
import {
  formatScheduleTime,
  getWeekdayLabel,
  type ScheduleSlot,
} from "@/lib/schedule";
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

type StudentWithSchedule = Student & {
  scheduleSlots: StudentScheduleSlot[];
  attendance: Pick<AttendanceRecord, "timeIn" | "timeOut">[];
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

function buildWeeklySchedule(
  slots: StudentScheduleSlot[]
): WeeklyScheduleEntry[] {
  return slots
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      dayLabel: getWeekdayLabel(slot.dayOfWeek),
      startTime: slot.startTime,
      endTime: slot.endTime,
      isEnabled: slot.isEnabled,
      displayTime: `${formatScheduleTime(slot.startTime)} – ${formatScheduleTime(slot.endTime)}`,
    }));
}

function getEnabledDutyDaysLabel(slots: StudentScheduleSlot[]): string {
  const enabled = slots
    .filter((slot) => slot.isEnabled)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((slot) => getWeekdayLabel(slot.dayOfWeek).slice(0, 3));

  return enabled.length > 0 ? enabled.join(", ") : "No duty days set";
}

function hasConfiguredSchedule(slots: StudentScheduleSlot[]): boolean {
  return slots.some((slot) => slot.isEnabled);
}

function buildRecommendation(
  student: Pick<Student, "firstName" | "lastName" | "assignment">,
  status: ScheduleDutyStatus,
  slot: StudentScheduleSlot | null,
  minutesLate: number | null
): string | null {
  const name = `${student.firstName} ${student.lastName}`;
  const assignment = getStudentAssignmentLabel(student.assignment);

  switch (status) {
    case "ABSENT":
      return `${name} was scheduled for ${assignment} duty today (${formatScheduleTime(slot?.startTime ?? "08:00")}–${formatScheduleTime(slot?.endTime ?? "17:00")}) but did not time in. Mark as absent and follow up.`;
    case "LATE":
      return `${name} timed in ${minutesLate ?? 0} minute${minutesLate === 1 ? "" : "s"} late for ${assignment} duty (scheduled ${formatScheduleTime(slot?.startTime ?? "08:00")}).`;
    case "WAITING":
      return `${name} is scheduled for ${assignment} duty at ${formatScheduleTime(slot?.startTime ?? "08:00")} and has not timed in yet. Monitor for late arrival.`;
    case "UPCOMING":
      return `${name} has ${assignment} duty later today at ${formatScheduleTime(slot?.startTime ?? "08:00")}.`;
    case "OFF_DUTY":
      return null;
    default:
      return null;
  }
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
    return { status: "UPCOMING", slot: slot as StudentScheduleSlot, minutesLate: null };
  }

  if (referenceNow.getTime() < graceEnd.getTime()) {
    return { status: "WAITING", slot: slot as StudentScheduleSlot, minutesLate: null };
  }

  if (referenceNow.getTime() <= scheduledEnd.getTime()) {
    return { status: "ABSENT", slot: slot as StudentScheduleSlot, minutesLate: null };
  }

  return { status: "ABSENT", slot: slot as StudentScheduleSlot, minutesLate: null };
}

function mapStudentRow(
  student: StudentWithSchedule,
  viewDate: Date,
  now: Date
): StudentScheduleMonitorRow {
  const weeklySchedule = buildWeeklySchedule(student.scheduleSlots);
  const attendance = student.attendance[0] ?? null;
  const evaluation = evaluateStudentScheduleStatus(
    student.scheduleSlots,
    attendance,
    viewDate,
    now
  );

  let status = evaluation.status;
  if (!hasConfiguredSchedule(student.scheduleSlots) && status === "OFF_DUTY") {
    status = "OFF_DUTY";
  }

  const recommendation = buildRecommendation(
    student,
    status,
    evaluation.slot,
    evaluation.minutesLate
  );

  return {
    id: student.id,
    studentId: student.studentId,
    firstName: student.firstName,
    lastName: student.lastName,
    photoUrl: student.photoUrl,
    studentType: student.studentType,
    assignment: student.assignment,
    department: student.department,
    dutyDaysLabel: getEnabledDutyDaysLabel(student.scheduleSlots),
    scheduledStart: evaluation.slot?.startTime ?? null,
    scheduledEnd: evaluation.slot?.endTime ?? null,
    scheduledStartDisplay: evaluation.slot
      ? formatScheduleTime(evaluation.slot.startTime)
      : null,
    scheduledEndDisplay: evaluation.slot
      ? formatScheduleTime(evaluation.slot.endTime)
      : null,
    timeIn: attendance?.timeIn ?? null,
    timeOut: attendance?.timeOut ?? null,
    timeInDisplay: formatTime(attendance?.timeIn),
    status,
    minutesLate: evaluation.minutesLate,
    recommendation,
    weeklySchedule,
  };
}

export async function getScheduleMonitoringData(
  session: SessionPayload,
  viewDate: Date = getTodayStart()
): Promise<ScheduleMonitoringData> {
  const departmentFilter = getStudentDepartmentFilter(session);
  const dayStart = getManilaDayStart(viewDate);
  const now = new Date();

  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      ...departmentFilter,
    },
    include: {
      scheduleSlots: { orderBy: { dayOfWeek: "asc" } },
      attendance: {
        where: { date: dayStart },
        take: 1,
        select: { timeIn: true, timeOut: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const rows = students.map((student) =>
    mapStudentRow(student, viewDate, now)
  );

  const scheduledToday = rows.filter((row) => row.status !== "OFF_DUTY");
  const recommendations = rows.filter(
    (row) =>
      row.recommendation &&
      ["ABSENT", "LATE", "WAITING"].includes(row.status)
  );

  const noScheduleConfigured = rows.filter(
    (row) => !row.weeklySchedule.some((slot) => slot.isEnabled)
  ).length;

  return {
    summary: {
      date: formatManilaDateInput(viewDate),
      dayLabel: getWeekdayLabel(getManilaDayOfWeek(viewDate)),
      totalActiveStudents: rows.length,
      scheduledToday: scheduledToday.length,
      offDutyToday: rows.length - scheduledToday.length,
      onTime: rows.filter((row) => row.status === "ON_TIME").length,
      late: rows.filter((row) => row.status === "LATE").length,
      absent: rows.filter((row) => row.status === "ABSENT").length,
      waiting: rows.filter((row) => row.status === "WAITING").length,
      upcoming: rows.filter((row) => row.status === "UPCOMING").length,
      completed: rows.filter((row) => row.status === "COMPLETED").length,
      noScheduleConfigured,
    },
    recommendations: recommendations.sort((a, b) => {
      const order: Record<ScheduleDutyStatus, number> = {
        ABSENT: 0,
        LATE: 1,
        WAITING: 2,
        UPCOMING: 3,
        ON_TIME: 4,
        COMPLETED: 5,
        OFF_DUTY: 6,
      };
      return order[a.status] - order[b.status];
    }),
    students: rows,
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

export function formatStudentScheduleSummary(row: StudentScheduleMonitorRow): string {
  if (!row.weeklySchedule.some((slot) => slot.isEnabled)) {
    return "No duty schedule configured";
  }

  const enabledDays = row.weeklySchedule
    .filter((slot) => slot.isEnabled)
    .map((slot) => `${slot.dayLabel} ${slot.displayTime}`)
    .join(" · ");

  return `${enabledDays} · ${getStudentTypeLabel(row.studentType)} · ${getDepartmentLabel(row.department)}`;
}
