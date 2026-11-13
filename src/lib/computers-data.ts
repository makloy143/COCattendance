import type { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { IdStockError } from "@/lib/id-maintenance";
import { formatManilaDateInput, getManilaDayStart } from "@/lib/date-utils";
import {
  COMPUTER_GROUPS,
  COMPUTER_STATUS_LABELS,
  computerLocationLabel,
  emptyComputerCounts,
  parseComputerGroup,
  parseComputerStatus,
  type ComputerGroup,
  type ComputerLocationRow,
  type ComputerRow,
  type ComputerStatus,
  type ComputerStatusCounts,
} from "@/lib/computers";
import {
  ACTIVE_MAINTENANCE_STATUSES,
  buildCreateEvents,
  generateMaintenanceNumber,
  isUniqueConstraintError,
  type MaintenancePriorityValue,
} from "@/lib/maintenance";
import type { ComputerTicket } from "@/lib/computers";
import type { computerSchema } from "@/lib/validations";

type ComputerInput = z.infer<typeof computerSchema>;

function clean(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

type ComputerRecord = Awaited<ReturnType<typeof findComputers>>[number];

function findComputers(where: object = {}) {
  return prisma.computer.findMany({
    where,
    include: { location: true },
    orderBy: [{ location: { group: "asc" } }, { location: { sortOrder: "asc" } }, { assetTag: "asc" }],
  });
}

function toRow(record: ComputerRecord, ticket: ComputerTicket | null = null): ComputerRow {
  return {
    id: record.id,
    assetTag: record.assetTag,
    locationId: record.locationId,
    locationName: record.location.name,
    group: parseComputerGroup(record.location.group),
    seatLabel: record.seatLabel ?? "",
    assignedTo: record.assignedTo ?? "",
    brand: record.brand ?? "",
    model: record.model ?? "",
    serialNumber: record.serialNumber ?? "",
    processor: record.processor ?? "",
    ram: record.ram ?? "",
    storage: record.storage ?? "",
    operatingSystem: record.operatingSystem ?? "",
    monitor: record.monitor ?? "",
    status: parseComputerStatus(record.status),
    issue: record.issue ?? "",
    dateAcquired: record.dateAcquired ? formatManilaDateInput(record.dateAcquired) : "",
    warrantyEnd: record.warrantyEnd ? formatManilaDateInput(record.warrantyEnd) : "",
    notes: record.notes ?? "",
    updatedAt: record.updatedAt.toISOString(),
    ticket,
  };
}

// Tickets carry the computer's asset tag as their asset number; that is the
// link between the two modules.
async function activeTickets(assetTags: string[]) {
  if (assetTags.length === 0) return new Map<string, ComputerTicket>();
  const records = await prisma.maintenanceRecord.findMany({
    where: { assetNumber: { in: assetTags }, status: { in: ACTIVE_MAINTENANCE_STATUSES } },
    orderBy: { createdAt: "asc" },
    select: { id: true, maintenanceNumber: true, status: true, assetNumber: true },
  });
  return new Map(
    records.map((record) => [
      record.assetNumber,
      { id: record.id, number: record.maintenanceNumber, status: record.status },
    ])
  );
}

export async function listComputers(): Promise<ComputerRow[]> {
  const records = await findComputers();
  const tickets = await activeTickets(records.map((record) => record.assetTag));
  return records.map((record) => toRow(record, tickets.get(record.assetTag) ?? null));
}

export async function listComputerLocations(): Promise<ComputerLocationRow[]> {
  const locations = await prisma.computerLocation.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { computers: true } } },
  });
  return locations
    .map((location) => ({
      id: location.id,
      name: location.name,
      group: parseComputerGroup(location.group),
      active: location.active,
      computerCount: location._count.computers,
    }))
    .sort((a, b) => COMPUTER_GROUPS.indexOf(a.group) - COMPUTER_GROUPS.indexOf(b.group));
}

export type ComputerDashboardData = {
  totals: ComputerStatusCounts;
  groups: Array<{ group: ComputerGroup; places: number; counts: ComputerStatusCounts }>;
  departments: Array<{ id: string; name: string; counts: ComputerStatusCounts }>;
  attention: ComputerRow[];
  attentionTotal: number;
  warrantyExpiring: number;
};

export async function getComputerDashboard(): Promise<ComputerDashboardData> {
  const [rows, locations] = await Promise.all([listComputers(), listComputerLocations()]);
  const totals = emptyComputerCounts();
  const byGroup = new Map<ComputerGroup, ComputerStatusCounts>(
    COMPUTER_GROUPS.map((group) => [group, emptyComputerCounts()])
  );
  const byLocation = new Map<string, ComputerStatusCounts>();

  for (const row of rows) {
    for (const counts of [
      totals,
      byGroup.get(row.group)!,
      byLocation.get(row.locationId) ?? byLocation.set(row.locationId, emptyComputerCounts()).get(row.locationId)!,
    ]) {
      counts[row.status] += 1;
      counts.total += 1;
    }
  }

  const today = formatManilaDateInput();
  const soon = formatManilaDateInput(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
  const attention = rows
    .filter((row) => row.status === "DEFECTIVE" || row.status === "UNDER_REPAIR")
    .sort((a, b) => (a.status === b.status ? b.updatedAt.localeCompare(a.updatedAt) : a.status === "DEFECTIVE" ? -1 : 1));

  return {
    totals,
    groups: COMPUTER_GROUPS.map((group) => ({
      group,
      places: locations.filter((location) => location.group === group && location.active).length,
      counts: byGroup.get(group)!,
    })),
    departments: locations
      .filter((location) => location.group === "DEPARTMENT" && (location.active || location.computerCount > 0))
      .map((location) => ({
        id: location.id,
        name: location.name,
        counts: byLocation.get(location.id) ?? emptyComputerCounts(),
      })),
    attention: attention.slice(0, 6),
    attentionTotal: attention.length,
    warrantyExpiring: rows.filter(
      (row) => row.status !== "RETIRED" && row.warrantyEnd && row.warrantyEnd >= today && row.warrantyEnd <= soon
    ).length,
  };
}

function toData(input: ComputerInput) {
  const text = (value: string) => (value ? value : null);
  const needsIssue = input.status === "DEFECTIVE" || input.status === "UNDER_REPAIR";
  return {
    assetTag: clean(input.assetTag).toUpperCase(),
    locationId: input.locationId,
    seatLabel: text(input.seatLabel),
    assignedTo: text(input.assignedTo),
    brand: text(input.brand),
    model: text(input.model),
    serialNumber: text(input.serialNumber),
    processor: text(input.processor),
    ram: text(input.ram),
    storage: text(input.storage),
    operatingSystem: text(input.operatingSystem),
    monitor: text(input.monitor),
    status: input.status,
    issue: needsIssue ? text(input.issue) : null,
    dateAcquired: input.dateAcquired ? getManilaDayStart(input.dateAcquired) : null,
    warrantyEnd: input.warrantyEnd ? getManilaDayStart(input.warrantyEnd) : null,
    notes: text(input.notes),
  };
}

async function requireLocation(id: string, allowInactive: boolean) {
  const location = await prisma.computerLocation.findUnique({ where: { id } });
  if (!location || (!location.active && !allowInactive)) {
    throw new IdStockError("Choose a location from Settings.");
  }
  return location;
}

export async function createComputer(input: ComputerInput, actor?: string) {
  const location = await requireLocation(input.locationId, false);
  const data = toData(input);
  try {
    const created = await prisma.computer.create({
      data: {
        ...data,
        history: {
          create: {
            action: "ADDED",
            detail: `Added to ${computerLocationLabel(location)} as ${COMPUTER_STATUS_LABELS[input.status]}.`,
            actor: actor ?? null,
          },
        },
      },
      include: { location: true },
    });
    return toRow(created);
  } catch (error) {
    if (isUniqueViolation(error)) throw new IdStockError("That asset tag is already used.");
    throw error;
  }
}

export async function updateComputer(id: string, input: ComputerInput, actor?: string) {
  const existing = await prisma.computer.findUnique({ where: { id }, include: { location: true } });
  if (!existing) throw new IdStockError("Computer was not found.");
  const location = await requireLocation(input.locationId, input.locationId === existing.locationId);
  const data = toData(input);

  const events: Array<{ action: string; detail: string }> = [];
  if (existing.locationId !== data.locationId) {
    events.push({
      action: "MOVED",
      detail: `Moved from ${computerLocationLabel(existing.location)} to ${computerLocationLabel(location)}.`,
    });
  }
  if (existing.status !== data.status) {
    const from = COMPUTER_STATUS_LABELS[parseComputerStatus(existing.status)];
    const to = COMPUTER_STATUS_LABELS[data.status as ComputerStatus];
    events.push({
      action: "STATUS",
      detail: `Status changed from ${from} to ${to}${data.issue ? `: ${data.issue}` : ""}.`,
    });
  }
  if ((existing.assignedTo ?? "") !== (data.assignedTo ?? "")) {
    events.push({
      action: "ASSIGNED",
      detail: data.assignedTo ? `Assigned to ${data.assignedTo}.` : "Assignment cleared.",
    });
  }
  if (events.length === 0) {
    events.push({ action: "EDITED", detail: "Details updated." });
  }

  try {
    const updated = await prisma.computer.update({
      where: { id },
      data: {
        ...data,
        history: { create: events.map((event) => ({ ...event, actor: actor ?? null })) },
      },
      include: { location: true },
    });
    const tickets = await activeTickets([updated.assetTag]);
    return toRow(updated, tickets.get(updated.assetTag) ?? null);
  } catch (error) {
    if (isUniqueViolation(error)) throw new IdStockError("That asset tag is already used.");
    throw error;
  }
}

export async function openComputerTicket(
  id: string,
  input: { problem: string; priority: MaintenancePriorityValue },
  actor: string
) {
  const computer = await prisma.computer.findUnique({ where: { id }, include: { location: true } });
  if (!computer) throw new IdStockError("Computer was not found.");
  if (computer.status === "RETIRED") {
    throw new IdStockError("A retired computer can't be sent to maintenance.");
  }
  const existing = (await activeTickets([computer.assetTag])).get(computer.assetTag);
  if (existing) {
    throw new IdStockError(`This computer already has an open ticket, ${existing.number}.`);
  }

  const problem = input.problem.trim();
  const nextStatus = computer.status === "DEFECTIVE" ? "DEFECTIVE" : "UNDER_REPAIR";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const maintenanceNumber = await generateMaintenanceNumber(tx);
        const record = await tx.maintenanceRecord.create({
          data: {
            maintenanceNumber,
            itemName: [computer.brand, computer.model].filter(Boolean).join(" ") || "Computer",
            equipmentType: "Desktop Computer",
            assetNumber: computer.assetTag,
            serialNumber: computer.serialNumber,
            problem,
            dateReported: getManilaDayStart(),
            reportedBy: actor,
            location: [computerLocationLabel(computer.location), computer.seatLabel].filter(Boolean).join(", "),
            priority: input.priority,
            status: "OPEN",
          },
        });
        await tx.maintenanceEvent.createMany({
          data: buildCreateEvents({ status: "OPEN", createdBy: actor }).map((event) => ({
            maintenanceId: record.id,
            eventType: event.eventType,
            message: event.message,
            createdBy: event.createdBy ?? null,
          })),
        });
        await tx.computer.update({
          where: { id },
          data: {
            status: nextStatus,
            issue: problem.slice(0, 300),
            history: {
              create: {
                action: "TICKET",
                detail: `Maintenance ticket ${maintenanceNumber} opened: ${problem}`,
                actor,
              },
            },
          },
        });
        return { id: record.id, number: maintenanceNumber, status: "OPEN" };
      });
    } catch (error) {
      if (isUniqueConstraintError(error) && attempt < 4) continue;
      throw error;
    }
  }
  throw new IdStockError("Couldn't open a ticket. Try again.");
}

// Called when a maintenance ticket changes status. A closed ticket updates the
// computer it was opened for: completed means working again, unrepairable
// means defective. A cancelled ticket leaves the computer as it is.
export async function syncComputerWithTicket(
  tx: Prisma.TransactionClient,
  ticket: {
    id: string;
    maintenanceNumber: string;
    assetNumber: string;
    previousStatus: string;
    nextStatus: string;
  },
  actor?: string
) {
  if (ticket.previousStatus === ticket.nextStatus) return;
  const nextComputerStatus =
    ticket.nextStatus === "COMPLETED" ? "WORKING" : ticket.nextStatus === "UNREPAIRABLE" ? "DEFECTIVE" : null;
  if (!nextComputerStatus) return;

  const computer = await tx.computer.findUnique({ where: { assetTag: ticket.assetNumber } });
  if (!computer || computer.status === "RETIRED" || computer.status === nextComputerStatus) return;

  const otherOpen = await tx.maintenanceRecord.count({
    where: {
      assetNumber: ticket.assetNumber,
      id: { not: ticket.id },
      status: { in: ACTIVE_MAINTENANCE_STATUSES },
    },
  });
  if (otherOpen > 0) return;

  const from = COMPUTER_STATUS_LABELS[parseComputerStatus(computer.status)];
  const to = COMPUTER_STATUS_LABELS[nextComputerStatus];
  await tx.computer.update({
    where: { id: computer.id },
    data: {
      status: nextComputerStatus,
      issue: nextComputerStatus === "WORKING" ? null : computer.issue,
      history: {
        create: {
          action: "TICKET",
          detail: `Maintenance ticket ${ticket.maintenanceNumber} ${
            ticket.nextStatus === "COMPLETED" ? "completed" : "closed as unrepairable"
          }. Status changed from ${from} to ${to}.`,
          actor: actor ?? null,
        },
      },
    },
  });
}

export async function deleteComputer(id: string) {
  const existing = await prisma.computer.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new IdStockError("Computer was not found.");
  await prisma.computer.delete({ where: { id } });
  return { removed: true as const };
}

export type ComputerHistoryRow = {
  id: string;
  assetTag: string;
  action: string;
  detail: string;
  actor: string;
  createdAt: string;
};

export async function listComputerHistory(limit = 200): Promise<ComputerHistoryRow[]> {
  const rows = await prisma.computerHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { computer: { select: { assetTag: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    assetTag: row.computer.assetTag,
    action: row.action,
    detail: row.detail,
    actor: row.actor ?? "",
    createdAt: row.createdAt.toISOString(),
  }));
}

async function assertUniqueLocation(group: string, name: string, exceptId?: string) {
  const siblings = await prisma.computerLocation.findMany({
    where: { group },
    select: { id: true, name: true },
  });
  const key = name.toLowerCase();
  if (siblings.some((row) => row.id !== exceptId && clean(row.name).toLowerCase() === key)) {
    throw new IdStockError("That name is already in the list.");
  }
}

export async function createComputerLocation(input: { name: string; group: ComputerGroup }) {
  const name = clean(input.name);
  await assertUniqueLocation(input.group, name);
  const max = await prisma.computerLocation.aggregate({
    where: { group: input.group },
    _max: { sortOrder: true },
  });
  return prisma.computerLocation.create({
    data: { name, group: input.group, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
}

export async function updateComputerLocation(id: string, input: { name?: string; active?: boolean }) {
  const existing = await prisma.computerLocation.findUnique({ where: { id } });
  if (!existing) throw new IdStockError("Location was not found.");
  const name = input.name === undefined ? existing.name : clean(input.name);
  if (name.toLowerCase() !== existing.name.toLowerCase()) {
    await assertUniqueLocation(existing.group, name, id);
  }
  return prisma.computerLocation.update({
    where: { id },
    data: { name, ...(input.active === undefined ? {} : { active: input.active }) },
  });
}

// A location that still has computers is hidden, not deleted, so those
// computers keep their place until they are moved.
export async function removeComputerLocation(id: string) {
  const existing = await prisma.computerLocation.findUnique({
    where: { id },
    include: { _count: { select: { computers: true } } },
  });
  if (!existing) throw new IdStockError("Location was not found.");
  if (existing._count.computers > 0) {
    await prisma.computerLocation.update({ where: { id }, data: { active: false } });
    return { deactivated: true as const };
  }
  await prisma.computerLocation.delete({ where: { id } });
  return { deactivated: false as const };
}
