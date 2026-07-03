import { format, parseISO, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { buildMonitoringReportTableHtml } from "@/lib/monitoring-report-html";
import {
  getDefaultUserExperience,
  MONITORING_CATEGORIES,
  type MonitoringCategory,
  type MonitoringShift,
} from "@/lib/monitoring-systems";

export type MonitoringEntryDto = {
  id: string;
  systemId: string;
  systemName: string;
  category: MonitoringCategory;
  sortOrder: number;
  status: string;
  accountNo: string;
  uptime: string;
  downtime: string;
  restoration: string;
  userExperience: string;
  remarks: string;
};

export type MonitoringReportDto = {
  id: string;
  reportDate: string;
  shiftType: MonitoringShift;
  entries: MonitoringEntryDto[];
};

export type SaveMonitoringEntryInput = {
  systemId: string;
  status: string;
  accountNo?: string;
  uptime?: string;
  downtime?: string;
  restoration?: string;
  userExperience?: string;
  remarks?: string;
};

export function parseMonitoringDate(value: string, fallback: Date): Date {
  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) return startOfDay(fallback);
    return startOfDay(parsed);
  } catch {
    return startOfDay(fallback);
  }
}

function toEntryDto(
  entry: {
    id: string;
    systemId: string;
    status: string;
    accountNo: string | null;
    uptime: string | null;
    downtime: string | null;
    restoration: string | null;
    userExperience: string | null;
    remarks: string | null;
    system: {
      name: string;
      category: MonitoringCategory;
      sortOrder: number;
      accountNo: string | null;
    };
  }
): MonitoringEntryDto {
  return {
    id: entry.id,
    systemId: entry.systemId,
    systemName: entry.system.name,
    category: entry.system.category,
    sortOrder: entry.system.sortOrder,
    status: entry.status,
    accountNo: entry.accountNo ?? entry.system.accountNo ?? "",
    uptime: entry.uptime ?? "",
    downtime: entry.downtime ?? "",
    restoration: entry.restoration ?? "",
    userExperience:
      entry.userExperience ?? getDefaultUserExperience(entry.system.category),
    remarks: entry.remarks ?? "",
  };
}

async function getPreviousReport(beforeDate: Date) {
  return prisma.monitoringReport.findFirst({
    where: { reportDate: { lt: beforeDate } },
    orderBy: { reportDate: "desc" },
    include: {
      entries: true,
    },
  });
}

function buildDefaultEntryValues(
  system: {
    id: string;
    accountNo: string | null;
    category: MonitoringCategory;
  },
  previousEntry?: {
    status: string;
    accountNo: string | null;
    uptime: string | null;
    downtime: string | null;
    restoration: string | null;
    userExperience: string | null;
    remarks: string | null;
  }
) {
  return {
    status: previousEntry?.status ?? "Up",
    accountNo: previousEntry?.accountNo ?? system.accountNo ?? null,
    uptime: previousEntry?.uptime ?? null,
    downtime: previousEntry?.downtime ?? null,
    restoration: previousEntry?.restoration ?? null,
    userExperience:
      previousEntry?.userExperience ?? getDefaultUserExperience(system.category),
    remarks: previousEntry?.remarks ?? null,
  };
}

export async function getOrCreateDailyReport(date: Date): Promise<MonitoringReportDto> {
  const reportDate = startOfDay(date);

  const existing = await prisma.monitoringReport.findUnique({
    where: { reportDate },
    include: {
      entries: {
        include: {
          system: true,
        },
      },
    },
  });

  if (existing) {
    const entries = existing.entries
      .map(toEntryDto)
      .sort((a, b) => {
        const categoryDiff =
          MONITORING_CATEGORIES.indexOf(a.category) -
          MONITORING_CATEGORIES.indexOf(b.category);
        if (categoryDiff !== 0) return categoryDiff;
        return a.sortOrder - b.sortOrder;
      });

    return {
      id: existing.id,
      reportDate: format(reportDate, "yyyy-MM-dd"),
      shiftType: (existing.shiftType as MonitoringShift) ?? "IN",
      entries,
    };
  }

  const [systems, previousReport] = await Promise.all([
    prisma.monitoringSystem.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    getPreviousReport(reportDate),
  ]);

  const previousEntries = previousReport
    ? new Map(previousReport.entries.map((entry) => [entry.systemId, entry]))
    : new Map<
        string,
        {
          status: string;
          accountNo: string | null;
          uptime: string | null;
          downtime: string | null;
          restoration: string | null;
          userExperience: string | null;
          remarks: string | null;
        }
      >();

  const created = await prisma.monitoringReport.create({
    data: {
      reportDate,
      shiftType: previousReport?.shiftType ?? "IN",
      entries: {
        create: systems.map((system) => {
          const previous = previousEntries.get(system.id);
          const defaults = buildDefaultEntryValues(system, previous);
          return {
            systemId: system.id,
            ...defaults,
          };
        }),
      },
    },
    include: {
      entries: {
        include: {
          system: true,
        },
      },
    },
  });

  const entries = created.entries
    .map(toEntryDto)
    .sort((a, b) => {
      const categoryDiff =
        MONITORING_CATEGORIES.indexOf(a.category) -
        MONITORING_CATEGORIES.indexOf(b.category);
      if (categoryDiff !== 0) return categoryDiff;
      return a.sortOrder - b.sortOrder;
    });

  return {
    id: created.id,
    reportDate: format(reportDate, "yyyy-MM-dd"),
    shiftType: (created.shiftType as MonitoringShift) ?? "IN",
    entries,
  };
}

export async function saveDailyReport(
  date: Date,
  entries: SaveMonitoringEntryInput[],
  shiftType: MonitoringShift = "IN"
): Promise<MonitoringReportDto> {
  const reportDate = startOfDay(date);
  const report = await getOrCreateDailyReport(reportDate);

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.monitoringReportEntry.update({
        where: {
          reportId_systemId: {
            reportId: report.id,
            systemId: entry.systemId,
          },
        },
        data: {
          status: entry.status,
          accountNo: entry.accountNo?.trim() || null,
          uptime: entry.uptime?.trim() || null,
          downtime: entry.downtime?.trim() || null,
          restoration: entry.restoration?.trim() || null,
          userExperience: entry.userExperience?.trim() || null,
          remarks: entry.remarks?.trim() || null,
        },
      })
    )
  );

  await prisma.monitoringReport.update({
    where: { id: report.id },
    data: { updatedAt: new Date(), shiftType },
  });

  return getOrCreateDailyReport(reportDate);
}

export function buildMonitoringExcelBuffer(report: MonitoringReportDto): Buffer {
  const html = `<!DOCTYPE html><html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${buildMonitoringReportTableHtml({
    reportDate: report.reportDate,
    shiftType: report.shiftType,
    entries: report.entries,
  })}</body></html>`;

  return Buffer.from(html, "utf-8");
}

export function buildMonitoringFilename(reportDate: string) {
  return `daily-monitoring_${reportDate}.xls`;
}

export type MonitoringDashboardData = {
  totalSystems: number;
  systemsUp: number;
  systemsDown: number;
  systemsDegraded: number;
  reportDate: string;
  lastUpdated: string | null;
  issues: Array<{
    systemName: string;
    status: string;
    remarks: string;
  }>;
  recentReports: Array<{
    reportDate: string;
    updatedAt: string;
    downCount: number;
    degradedCount: number;
  }>;
};

export async function getMonitoringDashboardData(): Promise<MonitoringDashboardData> {
  const today = startOfDay(new Date());
  const report = await getOrCreateDailyReport(today);

  const systemsUp = report.entries.filter((e) => e.status === "Up").length;
  const systemsDown = report.entries.filter((e) => e.status === "Down").length;
  const systemsDegraded = report.entries.filter(
    (e) => e.status === "With Degradation"
  ).length;

  const issues = report.entries
    .filter((e) => e.status === "Down" || e.status === "With Degradation")
    .map((e) => ({
      systemName: e.systemName,
      status: e.status,
      remarks: e.remarks,
    }));

  const recentReportsRaw = await prisma.monitoringReport.findMany({
    orderBy: { reportDate: "desc" },
    take: 5,
    include: {
      entries: {
        select: { status: true },
      },
    },
  });

  const reportRecord = await prisma.monitoringReport.findUnique({
    where: { reportDate: today },
    select: { updatedAt: true },
  });

  return {
    totalSystems: report.entries.length,
    systemsUp,
    systemsDown,
    systemsDegraded,
    reportDate: report.reportDate,
    lastUpdated: reportRecord?.updatedAt.toISOString() ?? null,
    issues,
    recentReports: recentReportsRaw.map((item) => ({
      reportDate: format(item.reportDate, "yyyy-MM-dd"),
      updatedAt: item.updatedAt.toISOString(),
      downCount: item.entries.filter((e) => e.status === "Down").length,
      degradedCount: item.entries.filter(
        (e) => e.status === "With Degradation"
      ).length,
    })),
  };
}
