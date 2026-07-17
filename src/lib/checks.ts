import { addMonths, subDays } from "date-fns";
import type {
  CheckCadence,
  CheckCategory,
  CheckStatus,
  CheckTemplate,
  DepartmentCheckLog,
} from "@/generated/prisma/client";
import {
  formatCadenceSchedule,
  type CheckItemDto,
  type CheckTemplateDto,
} from "@/lib/checks-shared";
import { prisma } from "@/lib/db";
import {
  APP_TIMEZONE,
  formatManilaDateInput,
  getManilaDayStart,
  getTodayStart,
} from "@/lib/date-utils";

export {
  CADENCE_LABELS,
  CATEGORY_LABELS,
  CHECK_CADENCES,
  CHECK_CATEGORIES,
  CHECK_STATUSES,
  DEFAULT_CHECK_TEMPLATES,
  STATUS_LABELS,
  WEEKDAY_OPTIONS,
  type CheckCadenceValue,
  type CheckCategoryValue,
  type CheckItemDto,
  type CheckStatusValue,
  type CheckTemplateDto,
} from "@/lib/checks-shared";

function getManilaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    dayOfWeek: weekdayMap[get("weekday")] ?? 1,
  };
}

export function getManilaDayOfWeek(date: Date = new Date()): number {
  return getManilaParts(date).dayOfWeek;
}

export function getPeriodStart(
  cadence: CheckCadence,
  date: Date = new Date()
): Date {
  const dateKey = formatManilaDateInput(date);
  const parts = getManilaParts(date);

  if (cadence === "DAILY") {
    return getManilaDayStart(dateKey);
  }

  if (cadence === "WEEKLY") {
    const anchor = getManilaDayStart(dateKey);
    const offset = parts.dayOfWeek - 1;
    return getManilaDayStart(subDays(anchor, offset));
  }

  return getManilaDayStart(`${parts.year}-${String(parts.month).padStart(2, "0")}-01`);
}

export function isTemplateDueOnDate(
  template: Pick<CheckTemplate, "cadence" | "dayOfWeek" | "dayOfMonth" | "isActive">,
  date: Date = new Date()
): boolean {
  if (!template.isActive) return false;

  const parts = getManilaParts(date);

  switch (template.cadence) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return template.dayOfWeek === parts.dayOfWeek;
    case "MONTHLY":
      return template.dayOfMonth === parts.day;
    default:
      return false;
  }
}

function isResolvedStatus(status: CheckStatus | null | undefined): boolean {
  return status === "COMPLETED" || status === "ISSUE_FOUND" || status === "SKIPPED";
}

async function getLatestLogForPeriod(
  templateId: string,
  periodStart: Date
): Promise<DepartmentCheckLog | null> {
  return prisma.departmentCheckLog.findFirst({
    where: {
      templateId,
      checkDate: periodStart,
    },
  });
}

function getLookbackDates(cadence: CheckCadence, today: Date): Date[] {
  const dates: Date[] = [];
  const todayKey = formatManilaDateInput(today);

  if (cadence === "DAILY") {
    for (let i = 1; i <= 7; i++) {
      dates.push(getManilaDayStart(subDays(getManilaDayStart(todayKey), i)));
    }
    return dates;
  }

  if (cadence === "WEEKLY") {
    for (let i = 1; i <= 4; i++) {
      dates.push(getManilaDayStart(subDays(getManilaDayStart(todayKey), i * 7)));
    }
    return dates;
  }

  for (let i = 1; i <= 3; i++) {
    const monthDate = addMonths(getManilaDayStart(todayKey), -i);
    dates.push(getPeriodStart("MONTHLY", monthDate));
  }
  return dates;
}

export async function getCheckItemsForDate(
  date: Date = new Date()
): Promise<CheckItemDto[]> {
  const templates = await prisma.checkTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const items: CheckItemDto[] = [];

  for (const template of templates) {
    const periodStart = getPeriodStart(template.cadence, date);
    const periodKey = formatManilaDateInput(periodStart);
    const currentLog = await getLatestLogForPeriod(template.id, periodStart);

    if (isTemplateDueOnDate(template, date)) {
      if (!isResolvedStatus(currentLog?.status)) {
        items.push({
          templateId: template.id,
          department: template.department,
          title: template.title,
          description: template.description,
          category: template.category,
          cadence: template.cadence,
          cadenceLabel: formatCadenceSchedule(template),
          periodStart: periodKey,
          urgency: "due_today",
          overdueSince: null,
          logId: currentLog?.id ?? null,
          logStatus: currentLog?.status ?? null,
          logNotes: currentLog?.notes ?? null,
          checkedBy: currentLog?.checkedBy ?? null,
        });
      }
      continue;
    }

    const lookbackDates = getLookbackDates(template.cadence, date);
    for (const lookbackDate of lookbackDates) {
      if (!isTemplateDueOnDate(template, lookbackDate)) continue;

      const missedPeriodStart = getPeriodStart(template.cadence, lookbackDate);
      const missedLog = await getLatestLogForPeriod(
        template.id,
        missedPeriodStart
      );

      if (!isResolvedStatus(missedLog?.status)) {
        items.push({
          templateId: template.id,
          department: template.department,
          title: template.title,
          description: template.description,
          category: template.category,
          cadence: template.cadence,
          cadenceLabel: formatCadenceSchedule(template),
          periodStart: formatManilaDateInput(missedPeriodStart),
          urgency: "overdue",
          overdueSince: formatManilaDateInput(missedPeriodStart),
          logId: missedLog?.id ?? null,
          logStatus: missedLog?.status ?? null,
          logNotes: missedLog?.notes ?? null,
          checkedBy: missedLog?.checkedBy ?? null,
        });
        break;
      }
    }
  }

  return items.sort((a, b) => {
    if (a.urgency !== b.urgency) {
      return a.urgency === "overdue" ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
  });
}

export type ChecksDashboardData = {
  dueToday: number;
  overdue: number;
  completedToday: number;
  issuesFoundToday: number;
  activeTemplates: number;
  dueItems: CheckItemDto[];
  recentLogs: Array<{
    id: string;
    templateTitle: string;
    department: string;
    category: CheckCategory;
    status: CheckStatus;
    checkDate: string;
    notes: string | null;
    checkedBy: string | null;
    updatedAt: string;
  }>;
};

export async function getChecksDashboardData(): Promise<ChecksDashboardData> {
  const today = getTodayStart();

  const [templates, dueItems, recentLogsRaw, todayLogs] = await Promise.all([
    prisma.checkTemplate.count({ where: { isActive: true } }),
    getCheckItemsForDate(today),
    prisma.departmentCheckLog.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { template: true },
    }),
    prisma.departmentCheckLog.findMany({
      where: {
        checkDate: today,
        status: { in: ["COMPLETED", "ISSUE_FOUND", "SKIPPED"] },
      },
    }),
  ]);

  return {
    dueToday: dueItems.filter((item) => item.urgency === "due_today").length,
    overdue: dueItems.filter((item) => item.urgency === "overdue").length,
    completedToday: todayLogs.filter((log) => log.status === "COMPLETED").length,
    issuesFoundToday: todayLogs.filter((log) => log.status === "ISSUE_FOUND")
      .length,
    activeTemplates: templates,
    dueItems: dueItems.slice(0, 6),
    recentLogs: recentLogsRaw.map((log) => ({
      id: log.id,
      templateTitle: log.template.title,
      department: log.template.department,
      category: log.template.category,
      status: log.status,
      checkDate: formatManilaDateInput(log.checkDate),
      notes: log.notes,
      checkedBy: log.checkedBy,
      updatedAt: log.updatedAt.toISOString(),
    })),
  };
}

export async function listCheckTemplates(): Promise<CheckTemplateDto[]> {
  const templates = await prisma.checkTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return templates.map((template) => ({
    id: template.id,
    department: template.department,
    title: template.title,
    description: template.description,
    category: template.category,
    cadence: template.cadence,
    cadenceLabel: formatCadenceSchedule(template),
    dayOfWeek: template.dayOfWeek,
    dayOfMonth: template.dayOfMonth,
    sortOrder: template.sortOrder,
    isActive: template.isActive,
  }));
}

export async function upsertCheckLog(input: {
  templateId: string;
  periodStart: string;
  status: CheckStatus;
  notes?: string;
  checkedBy?: string;
}) {
  const checkDate = getManilaDayStart(input.periodStart);

  return prisma.departmentCheckLog.upsert({
    where: {
      templateId_checkDate: {
        templateId: input.templateId,
        checkDate,
      },
    },
    create: {
      templateId: input.templateId,
      checkDate,
      status: input.status,
      notes: input.notes?.trim() || null,
      checkedBy: input.checkedBy?.trim() || null,
    },
    update: {
      status: input.status,
      notes: input.notes?.trim() || null,
      checkedBy: input.checkedBy?.trim() || null,
      updatedAt: new Date(),
    },
    include: { template: true },
  });
}

export async function getCheckHistory(limit = 50) {
  const logs = await prisma.departmentCheckLog.findMany({
    orderBy: [{ checkDate: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: { template: true },
  });

  return logs.map((log) => ({
    id: log.id,
    templateId: log.templateId,
    templateTitle: log.template.title,
    department: log.template.department,
    category: log.template.category,
    cadence: log.template.cadence,
    status: log.status,
    checkDate: formatManilaDateInput(log.checkDate),
    notes: log.notes,
    checkedBy: log.checkedBy,
    updatedAt: log.updatedAt.toISOString(),
  }));
}
