import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import { maintenanceRecordSchema } from "@/lib/validations";
import {
  buildCreateEvents,
  buildMaintenanceWhere,
  defaultRestoreStatus,
  generateMaintenanceNumber,
  isUniqueConstraintError,
  maintenanceItemInclude,
  parseAttachmentInput,
  parseDateOnly,
  serializeMaintenance,
  syncItemAssetStatus,
  type MaintenanceListFilters,
} from "@/lib/maintenance";
import {
  isMaintenancePriority,
  isMaintenanceStatus,
  type MaintenancePriorityValue,
  type MaintenanceStatusValue,
} from "@/lib/maintenance-shared";
import type { AssetStatus } from "@/lib/inventory";

function filtersFromRequest(request: NextRequest): MaintenanceListFilters {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim().toUpperCase();
  const priority = searchParams.get("priority")?.trim().toUpperCase();

  return {
    search: searchParams.get("search")?.trim() || undefined,
    status: status && isMaintenanceStatus(status) ? status : undefined,
    priority:
      priority && isMaintenancePriority(priority) ? priority : undefined,
    equipmentType: searchParams.get("equipmentType")?.trim() || undefined,
    location: searchParams.get("location")?.trim() || undefined,
    dateFrom: searchParams.get("dateFrom")?.trim() || undefined,
    dateTo: searchParams.get("dateTo")?.trim() || undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireInventorySession();
    const filters = filtersFromRequest(request);

    const records = await prisma.maintenanceRecord.findMany({
      where: buildMaintenanceWhere(filters),
      include: maintenanceItemInclude,
      orderBy: [{ dateReported: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(records.map(serializeMaintenance));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch maintenance records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireInventorySession();

    const body = await request.json();
    const parsed = maintenanceRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    let attachment:
      | ReturnType<typeof parseAttachmentInput>
      | null
      | undefined;
    try {
      attachment = data.attachment
        ? parseAttachmentInput({
            data: data.attachment.data,
            mimeType: data.attachment.mimeType,
            name: data.attachment.name ?? "",
          })
        : undefined;
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid attachment",
        },
        { status: 400 }
      );
    }

    if (data.receivedItemId) {
      const item = await prisma.receivedItem.findUnique({
        where: { id: data.receivedItemId },
        select: { id: true },
      });
      if (!item) {
        return NextResponse.json(
          { error: "Selected inventory item was not found" },
          { status: 400 }
        );
      }
    }

    const status = data.status as MaintenanceStatusValue;
    const priority = data.priority as MaintenancePriorityValue;
    const restoreStatus = (data.restoreAssetStatus as AssetStatus | undefined)
      ?? defaultRestoreStatus(status);

    let created = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        created = await prisma.$transaction(async (tx) => {
          const maintenanceNumber = await generateMaintenanceNumber(tx);
          const record = await tx.maintenanceRecord.create({
            data: {
              maintenanceNumber,
              receivedItemId: data.receivedItemId?.trim() || null,
              itemName: data.itemName.trim(),
              equipmentType: data.equipmentType.trim(),
              assetNumber: data.assetNumber.trim(),
              serialNumber: data.serialNumber?.trim() || null,
              problem: data.problem.trim(),
              description: data.description?.trim() || null,
              dateReported: parseDateOnly(data.dateReported),
              reportedBy: data.reportedBy.trim(),
              location: data.location.trim(),
              priority,
              status,
              assignedTechnician: data.assignedTechnician?.trim() || null,
              diagnosticFindings: data.diagnosticFindings?.trim() || null,
              actionTaken: data.actionTaken?.trim() || null,
              partsReplaced: data.partsReplaced?.trim() || null,
              repairCost:
                data.repairCost === "" || data.repairCost === undefined
                  ? null
                  : Number(data.repairCost),
              dateSentForRepair: data.dateSentForRepair
                ? parseDateOnly(data.dateSentForRepair)
                : null,
              dateCompleted:
                data.dateCompleted
                  ? parseDateOnly(data.dateCompleted)
                  : status === "COMPLETED"
                    ? parseDateOnly(data.dateReported)
                    : null,
              vendor: data.vendor?.trim() || null,
              warranty: data.warranty?.trim() || null,
              remarks: data.remarks?.trim() || null,
              attachmentData: attachment ? Buffer.from(attachment.data) : null,
              attachmentMimeType: attachment?.mimeType ?? null,
              attachmentName: attachment?.name ?? null,
            },
          });

          const events = buildCreateEvents({
            assignedTechnician: data.assignedTechnician,
            diagnosticFindings: data.diagnosticFindings,
            partsReplaced: data.partsReplaced,
            remarks: data.remarks,
            status,
            createdBy: session.username,
          });

          if (events.length > 0) {
            await tx.maintenanceEvent.createMany({
              data: events.map((event) => ({
                maintenanceId: record.id,
                eventType: event.eventType,
                message: event.message,
                createdBy: event.createdBy ?? null,
              })),
            });
          }

          await syncItemAssetStatus(
            tx,
            data.receivedItemId?.trim() || null,
            restoreStatus
          );

          return tx.maintenanceRecord.findUniqueOrThrow({
            where: { id: record.id },
            include: maintenanceItemInclude,
          });
        });
        break;
      } catch (error) {
        if (isUniqueConstraintError(error) && attempt < 4) {
          continue;
        }
        throw error;
      }
    }

    if (!created) {
      return NextResponse.json(
        { error: "Failed to generate a unique maintenance number" },
        { status: 500 }
      );
    }

    return NextResponse.json(serializeMaintenance(created), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create maintenance record" },
      { status: 500 }
    );
  }
}
