import { format, parseISO, startOfDay } from "date-fns";
import type {
  MaintenanceEvent,
  MaintenanceEventType,
  MaintenanceRecord,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
  type AssetStatus,
} from "@/lib/inventory";
import {
  ACTIVE_MAINTENANCE_STATUSES,
  isMaintenancePriority,
  isMaintenanceStatus,
  MAINTENANCE_CHART_COLORS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_COLORS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUSES,
  type MaintenanceChartSlice,
  type MaintenancePriorityValue,
  type MaintenanceStats,
  type MaintenanceStatusValue,
} from "@/lib/maintenance-shared";

export * from "@/lib/maintenance-shared";

export function parseDateOnly(value: string): Date {
  return startOfDay(parseISO(value));
}

export function formatMaintenanceNumber(sequence: number): string {
  return `MT-${String(sequence).padStart(6, "0")}`;
}

export async function generateMaintenanceNumber(
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string> {
  const last = await tx.maintenanceRecord.findFirst({
    where: { maintenanceNumber: { startsWith: "MT-" } },
    orderBy: { maintenanceNumber: "desc" },
    select: { maintenanceNumber: true },
  });

  const lastSeq = last
    ? Number.parseInt(last.maintenanceNumber.replace(/^MT-/, ""), 10)
    : 0;
  const next = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return formatMaintenanceNumber(next);
}

export const maintenanceItemInclude = {
  receivedItem: {
    select: {
      id: true,
      itemName: true,
      itemType: true,
      category: true,
      brand: true,
      model: true,
      serialNumber: true,
      receivedByDepartment: true,
      assetStatus: true,
      borrows: {
        where: { status: "ACTIVE" },
        select: { id: true, status: true, quantityBorrowed: true },
      },
    },
  },
} satisfies Prisma.MaintenanceRecordInclude;

export const maintenanceDetailInclude = {
  ...maintenanceItemInclude,
  events: {
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.MaintenanceRecordInclude;

type MaintenanceWithItem = MaintenanceRecord & {
  receivedItem?: {
    id: string;
    itemName: string;
    itemType: string;
    category: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    receivedByDepartment: string;
    assetStatus: AssetStatus;
    borrows?: { id: string; status: string; quantityBorrowed: number }[];
  } | null;
  events?: MaintenanceEvent[];
};

export type MaintenanceDto = Omit<
  MaintenanceRecord,
  "attachmentData" | "repairCost"
> & {
  repairCost: number | null;
  hasAttachment: boolean;
  receivedItem?: MaintenanceWithItem["receivedItem"];
  events?: MaintenanceEvent[];
  inventoryStatus?: { key: string; label: string } | null;
};

export function serializeMaintenance(
  record: MaintenanceWithItem
): MaintenanceDto {
  const { attachmentData, ...rest } = record;
  const inventoryStatus = record.receivedItem
    ? {
        key: record.receivedItem.assetStatus,
        label: ASSET_STATUS_LABELS[record.receivedItem.assetStatus],
      }
    : null;

  return {
    ...rest,
    repairCost:
      rest.repairCost === null || rest.repairCost === undefined
        ? null
        : Number(rest.repairCost),
    hasAttachment: Boolean(attachmentData && attachmentData.length),
    inventoryStatus,
  };
}

export async function syncItemAssetStatus(
  tx: Prisma.TransactionClient | typeof prisma,
  itemId: string | null | undefined,
  restoreStatus?: AssetStatus | null
) {
  if (!itemId) return;

  const openCount = await tx.maintenanceRecord.count({
    where: {
      receivedItemId: itemId,
      status: { in: ACTIVE_MAINTENANCE_STATUSES },
    },
  });

  if (openCount > 0) {
    await tx.receivedItem.update({
      where: { id: itemId },
      data: { assetStatus: "UNDER_MAINTENANCE" },
    });
    return;
  }

  const nextStatus =
    restoreStatus && ASSET_STATUSES.includes(restoreStatus)
      ? restoreStatus
      : "AVAILABLE";

  await tx.receivedItem.update({
    where: { id: itemId },
    data: { assetStatus: nextStatus },
  });
}

export function defaultRestoreStatus(
  status: MaintenanceStatusValue
): AssetStatus {
  if (status === "UNREPAIRABLE") return "DAMAGED";
  return "AVAILABLE";
}

type EventInput = {
  eventType: MaintenanceEventType;
  message: string;
  createdBy?: string | null;
};

export async function createMaintenanceEvent(
  tx: Prisma.TransactionClient | typeof prisma,
  maintenanceId: string,
  event: EventInput
) {
  return tx.maintenanceEvent.create({
    data: {
      maintenanceId,
      eventType: event.eventType,
      message: event.message,
      createdBy: event.createdBy?.trim() || null,
    },
  });
}

export function buildCreateEvents(input: {
  assignedTechnician?: string | null;
  diagnosticFindings?: string | null;
  partsReplaced?: string | null;
  remarks?: string | null;
  status: MaintenanceStatusValue;
  createdBy?: string | null;
}): EventInput[] {
  const events: EventInput[] = [
    {
      eventType: "CREATED",
      message: "Issue reported",
      createdBy: input.createdBy,
    },
  ];

  if (input.assignedTechnician?.trim()) {
    events.push({
      eventType: "TECHNICIAN_ASSIGNED",
      message: `Assigned to ${input.assignedTechnician.trim()}`,
      createdBy: input.createdBy,
    });
  }
  if (input.diagnosticFindings?.trim()) {
    events.push({
      eventType: "DIAGNOSTIC_UPDATED",
      message: "Diagnostic findings added",
      createdBy: input.createdBy,
    });
  }
  if (input.partsReplaced?.trim()) {
    events.push({
      eventType: "PARTS_UPDATED",
      message: "Parts replaced recorded",
      createdBy: input.createdBy,
    });
  }
  if (input.remarks?.trim()) {
    events.push({
      eventType: "REMARKS_UPDATED",
      message: "Remarks added",
      createdBy: input.createdBy,
    });
  }
  if (input.status === "COMPLETED") {
    events.push({
      eventType: "REPAIR_COMPLETED",
      message: "Repair completed",
      createdBy: input.createdBy,
    });
  } else if (input.status !== "OPEN") {
    events.push({
      eventType: "STATUS_CHANGED",
      message: `Status set to ${MAINTENANCE_STATUS_LABELS[input.status]}`,
      createdBy: input.createdBy,
    });
  }

  return events;
}

export function buildUpdateEvents(
  existing: Pick<
    MaintenanceRecord,
    | "status"
    | "assignedTechnician"
    | "diagnosticFindings"
    | "partsReplaced"
    | "remarks"
  >,
  next: {
    status: MaintenanceStatusValue;
    assignedTechnician?: string | null;
    diagnosticFindings?: string | null;
    partsReplaced?: string | null;
    remarks?: string | null;
  },
  createdBy?: string | null
): EventInput[] {
  const events: EventInput[] = [];
  const actor = createdBy ?? null;

  if (existing.status !== next.status) {
    events.push({
      eventType:
        next.status === "COMPLETED" ? "REPAIR_COMPLETED" : "STATUS_CHANGED",
      message:
        next.status === "COMPLETED"
          ? "Repair completed"
          : `Status changed to ${MAINTENANCE_STATUS_LABELS[next.status]}`,
      createdBy: actor,
    });
  }

  const prevTech = existing.assignedTechnician?.trim() || "";
  const nextTech = next.assignedTechnician?.trim() || "";
  if (prevTech !== nextTech && nextTech) {
    events.push({
      eventType: "TECHNICIAN_ASSIGNED",
      message: `Assigned to ${nextTech}`,
      createdBy: actor,
    });
  }

  const prevDiag = existing.diagnosticFindings?.trim() || "";
  const nextDiag = next.diagnosticFindings?.trim() || "";
  if (prevDiag !== nextDiag && nextDiag) {
    events.push({
      eventType: "DIAGNOSTIC_UPDATED",
      message: prevDiag
        ? "Diagnostic findings updated"
        : "Diagnostic findings added",
      createdBy: actor,
    });
  }

  const prevParts = existing.partsReplaced?.trim() || "";
  const nextParts = next.partsReplaced?.trim() || "";
  if (prevParts !== nextParts && nextParts) {
    events.push({
      eventType: "PARTS_UPDATED",
      message: prevParts ? "Parts replaced updated" : "Parts replaced recorded",
      createdBy: actor,
    });
  }

  const prevRemarks = existing.remarks?.trim() || "";
  const nextRemarks = next.remarks?.trim() || "";
  if (prevRemarks !== nextRemarks && nextRemarks) {
    events.push({
      eventType: "REMARKS_UPDATED",
      message: prevRemarks ? "Remarks updated" : "Remarks added",
      createdBy: actor,
    });
  }

  if (events.length === 0) {
    events.push({
      eventType: "UPDATED",
      message: "Maintenance record updated",
      createdBy: actor,
    });
  }

  return events;
}

export type MaintenanceListFilters = {
  search?: string;
  status?: MaintenanceStatusValue;
  priority?: MaintenancePriorityValue;
  equipmentType?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function buildMaintenanceWhere(
  filters: MaintenanceListFilters
): Prisma.MaintenanceRecordWhereInput {
  const where: Prisma.MaintenanceRecordWhereInput = {};

  if (filters.status && isMaintenanceStatus(filters.status)) {
    where.status = filters.status;
  }
  if (filters.priority && isMaintenancePriority(filters.priority)) {
    where.priority = filters.priority;
  }
  if (filters.equipmentType?.trim()) {
    where.equipmentType = filters.equipmentType.trim();
  }
  if (filters.location?.trim()) {
    where.location = filters.location.trim();
  }
  if (filters.dateFrom || filters.dateTo) {
    where.dateReported = {};
    if (filters.dateFrom) {
      where.dateReported.gte = parseDateOnly(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.dateReported.lte = parseDateOnly(filters.dateTo);
    }
  }

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { maintenanceNumber: { contains: search, mode: "insensitive" } },
      { itemName: { contains: search, mode: "insensitive" } },
      { assetNumber: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { problem: { contains: search, mode: "insensitive" } },
      { reportedBy: { contains: search, mode: "insensitive" } },
      { assignedTechnician: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

function countBy<T extends string>(
  records: { [K in T]: string }[],
  key: T
): Map<string, number> {
  const map = new Map<string, number>();
  for (const record of records) {
    const value = record[key] || "Unknown";
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return map;
}

export async function getMaintenanceStats(
  filters: MaintenanceListFilters = {}
): Promise<MaintenanceStats> {
  const records = await prisma.maintenanceRecord.findMany({
    where: buildMaintenanceWhere(filters),
    select: {
      status: true,
      equipmentType: true,
      location: true,
      dateReported: true,
    },
  });

  const byStatusMap = countBy(records, "status");
  const byEquipmentMap = countBy(records, "equipmentType");
  const byLocationMap = countBy(records, "location");

  const monthlyMap = new Map<string, number>();
  for (const record of records) {
    const monthKey = format(record.dateReported, "yyyy-MM");
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + 1);
  }

  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, value]) => ({
      month,
      label: format(parseISO(`${month}-01`), "MMM yyyy"),
      value,
    }));

  const byStatus: MaintenanceChartSlice[] = MAINTENANCE_STATUSES.map(
    (status) => ({
      key: status,
      label: MAINTENANCE_STATUS_LABELS[status],
      value: byStatusMap.get(status) ?? 0,
      color: MAINTENANCE_STATUS_COLORS[status],
    })
  ).filter((slice) => slice.value > 0);

  const byEquipmentType: MaintenanceChartSlice[] = Array.from(
    byEquipmentMap.entries()
  )
    .sort((a, b) => b[1] - a[1])
    .map(([key, value], index) => ({
      key,
      label: key,
      value,
      color: MAINTENANCE_CHART_COLORS[index % MAINTENANCE_CHART_COLORS.length],
    }));

  const byLocation: MaintenanceChartSlice[] = Array.from(
    byLocationMap.entries()
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, value], index) => ({
      key,
      label: key,
      value,
      color: MAINTENANCE_CHART_COLORS[index % MAINTENANCE_CHART_COLORS.length],
    }));

  const countStatus = (status: MaintenanceStatusValue) =>
    byStatusMap.get(status) ?? 0;

  return {
    total: records.length,
    open: countStatus("OPEN") + countStatus("DIAGNOSING"),
    underRepair: countStatus("UNDER_REPAIR"),
    completed: countStatus("COMPLETED"),
    awaitingParts: countStatus("AWAITING_PARTS"),
    unrepairable: countStatus("UNREPAIRABLE"),
    diagnosing: countStatus("DIAGNOSING"),
    awaitingVendor: countStatus("AWAITING_VENDOR"),
    cancelled: countStatus("CANCELLED"),
    byStatus,
    byEquipmentType,
    byLocation,
    monthly,
  };
}

function csvEscape(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function maintenanceRecordsToCsv(
  records: MaintenanceDto[]
): string {
  const headers = [
    "Maintenance ID",
    "Asset/Item",
    "Equipment Type",
    "Asset Number",
    "Serial Number",
    "Problem",
    "Location",
    "Priority",
    "Status",
    "Reported By",
    "Date Reported",
    "Assigned Technician",
    "Date Completed",
    "Repair Cost",
    "Vendor",
    "Remarks",
  ];

  const rows = records.map((record) => [
    record.maintenanceNumber,
    record.itemName,
    record.equipmentType,
    record.assetNumber,
    record.serialNumber ?? "",
    record.problem,
    record.location,
    MAINTENANCE_PRIORITY_LABELS[record.priority as MaintenancePriorityValue],
    MAINTENANCE_STATUS_LABELS[record.status as MaintenanceStatusValue],
    record.reportedBy,
    format(record.dateReported, "yyyy-MM-dd"),
    record.assignedTechnician ?? "",
    record.dateCompleted ? format(record.dateCompleted, "yyyy-MM-dd") : "",
    record.repairCost ?? "",
    record.vendor ?? "",
    record.remarks ?? "",
  ]);

  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}

export type AttachmentPayload = {
  data: Uint8Array;
  mimeType: string;
  name: string;
};

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export function parseAttachmentInput(input: {
  data: string;
  mimeType: string;
  name: string;
}): AttachmentPayload {
  const mimeType = input.mimeType.trim();
  if (!ALLOWED_ATTACHMENT_TYPES.has(mimeType)) {
    throw new Error("Only JPG, PNG, WebP, or GIF images are allowed");
  }

  const base64 = input.data.includes(",")
    ? input.data.slice(input.data.indexOf(",") + 1)
    : input.data;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) {
    throw new Error("Attachment is empty");
  }
  if (buffer.length > MAX_ATTACHMENT_BYTES) {
    throw new Error("Attachment must be 2MB or smaller");
  }

  return {
    data: new Uint8Array(buffer),
    mimeType,
    name: input.name.trim() || "attachment.jpg",
  };
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
