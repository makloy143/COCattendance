import type {
  AttendanceRecord,
  Student,
  StudentScheduleSlot,
} from "@/generated/prisma/client";
import { getStudentDepartmentFilter, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  formatManilaDateInput,
  formatTime,
  getManilaDayOfWeek,
  getManilaDayStart,
  getTodayStart,
} from "@/lib/date-utils";
import { formatScheduleTime, getWeekdayLabel } from "@/lib/schedule";
import { getStudentAssignmentLabel } from "@/lib/student-assignment";
import {
  evaluateStudentScheduleStatus,
  type ScheduleDutyStatus,
  type ScheduleMonitoringData,
  type StudentScheduleMonitorRow,
  type WeeklyScheduleEntry,
} from "@/lib/schedule-monitoring-shared";

export type {
  ScheduleDutyStatus,
  ScheduleMonitoringData,
  ScheduleMonitoringSummary,
  StudentScheduleMonitorRow,
  WeeklyScheduleEntry,
} from "@/lib/schedule-monitoring-shared";

export {
  evaluateStudentScheduleStatus,
  formatStudentScheduleSummary,
  getScheduleStatusLabel,
  LATE_GRACE_MINUTES,
} from "@/lib/schedule-monitoring-shared";

type StudentWithSchedule = Student & {
  scheduleSlots: StudentScheduleSlot[];
  attendance: Pick<AttendanceRecord, "timeIn" | "timeOut">[];
};

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

  const status = evaluation.status;
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
  viewDate: Date = getTodayStart(),
  departmentScope?: string | null
): Promise<ScheduleMonitoringData> {
  const departmentFilter = getStudentDepartmentFilter(
    session,
    departmentScope
  );
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
