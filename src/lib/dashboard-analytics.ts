import type { SessionPayload } from "@/lib/auth";
import { getStudentDepartmentFilter } from "@/lib/auth";
import { getDepartmentLabel } from "@/lib/departments";
import {
  addManilaDays,
  formatManilaDateInput,
  getManilaDayOfWeek,
  getTodayStart,
} from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import { getStudentAssignmentLabel } from "@/lib/student-assignment";
import { getStudentTypeLabel } from "@/lib/student-type";

const TREND_DAYS = 14;

export type AnalyticsSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type AnalyticsTrendPoint = {
  date: string;
  label: string;
  timedIn: number;
  completed: number;
};

export type DashboardAnalyticsData = {
  scopeLabel: string;
  totalRecords: number;
  trend: AnalyticsTrendPoint[];
  byStatus: AnalyticsSlice[];
  byType: AnalyticsSlice[];
  byAssignment: AnalyticsSlice[];
};

const STATUS_COLORS = {
  completed: "#166534",
  stillIn: "#2563eb",
  open: "#ea580c",
} as const;

const TYPE_COLORS = ["#166534", "#0d9488", "#2563eb", "#7c3aed"] as const;

const ASSIGNMENT_COLORS = [
  "#dc2626",
  "#ea580c",
  "#2563eb",
  "#16a34a",
  "#0d9488",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#64748b",
] as const;

function formatTrendLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
  }).format(date);
}

export async function getDashboardAnalyticsData(
  session: SessionPayload
): Promise<DashboardAnalyticsData> {
  const departmentFilter = getStudentDepartmentFilter(session);
  const todayStart = getTodayStart();
  const rangeStart = addManilaDays(todayStart, -(TREND_DAYS - 1));

  const records = await prisma.attendanceRecord.findMany({
    where: {
      date: { gte: rangeStart, lte: todayStart },
      student: departmentFilter,
    },
    select: {
      date: true,
      timeIn: true,
      timeOut: true,
      student: {
        select: {
          studentType: true,
          assignment: true,
        },
      },
    },
  });

  const trendMap = new Map<string, { timedIn: number; completed: number }>();
  for (let i = 0; i < TREND_DAYS; i++) {
    const day = addManilaDays(rangeStart, i);
    const dayOfWeek = getManilaDayOfWeek(day);
    // Work days Mon–Sat (skip Sunday), matching duty schedules.
    if (dayOfWeek === 7) continue;
    trendMap.set(formatManilaDateInput(day), { timedIn: 0, completed: 0 });
  }

  let completedCount = 0;
  let stillInCount = 0;
  const typeCounts = new Map<string, number>();
  const assignmentCounts = new Map<string, number>();

  for (const record of records) {
    const dateKey = formatManilaDateInput(record.date);
    const bucket = trendMap.get(dateKey);
    const hasTimeIn = Boolean(record.timeIn);
    const hasTimeOut = Boolean(record.timeOut);

    if (bucket && hasTimeIn) {
      bucket.timedIn += 1;
      if (hasTimeOut) bucket.completed += 1;
    }

    if (hasTimeIn && hasTimeOut) completedCount += 1;
    else if (hasTimeIn) stillInCount += 1;

    if (hasTimeIn) {
      const typeKey = record.student.studentType;
      typeCounts.set(typeKey, (typeCounts.get(typeKey) ?? 0) + 1);

      const assignmentKey = record.student.assignment;
      assignmentCounts.set(
        assignmentKey,
        (assignmentCounts.get(assignmentKey) ?? 0) + 1
      );
    }
  }

  const trend: AnalyticsTrendPoint[] = [...trendMap.entries()].map(
    ([date, values]) => ({
      date,
      label: formatTrendLabel(new Date(`${date}T00:00:00+08:00`)),
      timedIn: values.timedIn,
      completed: values.completed,
    })
  );

  const totalRecords = completedCount + stillInCount;

  const byStatus: AnalyticsSlice[] = [
    {
      key: "completed",
      label: "Completed",
      value: completedCount,
      color: STATUS_COLORS.completed,
    },
    {
      key: "stillIn",
      label: "Still In",
      value: stillInCount,
      color: STATUS_COLORS.stillIn,
    },
  ].filter((slice) => slice.value > 0);

  if (byStatus.length === 0) {
    byStatus.push({
      key: "empty",
      label: "No records",
      value: 0,
      color: "#94a3b8",
    });
  }

  const byType: AnalyticsSlice[] = [...typeCounts.entries()]
    .map(([key, value], index) => ({
      key,
      label: getStudentTypeLabel(key as "SA" | "HK"),
      value,
      color: TYPE_COLORS[index % TYPE_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  if (byType.length === 0) {
    byType.push({
      key: "empty",
      label: "No records",
      value: 0,
      color: "#94a3b8",
    });
  }

  const byAssignment: AnalyticsSlice[] = [...assignmentCounts.entries()]
    .map(([key, value], index) => ({
      key,
      label: getStudentAssignmentLabel(key),
      value,
      color: ASSIGNMENT_COLORS[index % ASSIGNMENT_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const scopeLabel =
    session.role === "SUPER_ADMIN"
      ? "COC ILIGAN"
      : session.department
        ? `COC ILIGAN · ${getDepartmentLabel(session.department)}`
        : "COC ILIGAN";

  return {
    scopeLabel,
    totalRecords,
    trend,
    byStatus,
    byType,
    byAssignment,
  };
}
