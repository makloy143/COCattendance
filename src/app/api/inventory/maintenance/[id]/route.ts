import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import {
  maintenanceRecordUpdateSchema,
  maintenanceStatusUpdateSchema,
} from "@/lib/validations";
import {
  buildUpdateEvents,
  defaultRestoreStatus,
  isActiveMaintenanceStatus,
  maintenanceDetailInclude,
  parseAttachmentInput,
  parseDateOnly,
  serializeMaintenance,
  syncItemAssetStatus,
} from "@/lib/maintenance";
import type { MaintenanceStatusValue } from "@/lib/maintenance-shared";
import type { AssetStatus } from "@/lib/inventory";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireInventorySession();
    const { id } = await context.params;

    const record = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: maintenanceDetailInclude,
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(serializeMaintenance(record));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch maintenance record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireInventorySession();
    const { id } = await context.params;

    const existing = await prisma.maintenanceRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = maintenanceRecordUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;

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

    let attachment:
      | ReturnType<typeof parseAttachmentInput>
      | null
      | undefined;
    try {
      if (data.attachment === null) {
        attachment = null;
      } else if (data.attachment) {
        attachment = parseAttachmentInput({
          data: data.attachment.data,
          mimeType: data.attachment.mimeType,
          name: data.attachment.name ?? "",
        });
      }
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid attachment",
        },
        { status: 400 }
      );
    }

    const nextStatus = (data.status ?? existing.status) as MaintenanceStatusValue;
    const nextTechnician =
      data.assignedTechnician !== undefined
        ? data.assignedTechnician?.trim() || null
        : existing.assignedTechnician;
    const nextDiagnostic =
      data.diagnosticFindings !== undefined
        ? data.diagnosticFindings?.trim() || null
        : existing.diagnosticFindings;
    const nextParts =
      data.partsReplaced !== undefined
        ? data.partsReplaced?.trim() || null
        : existing.partsReplaced;
    const nextRemarks =
      data.remarks !== undefined
        ? data.remarks?.trim() || null
        : existing.remarks;

    const restoreStatus =
      (data.restoreAssetStatus as AssetStatus | undefined) ??
      defaultRestoreStatus(nextStatus);

    const previousItemId = existing.receivedItemId;
    const nextItemId =
      data.receivedItemId !== undefined
        ? data.receivedItemId.trim() || null
        : existing.receivedItemId;

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.update({
        where: { id },
        data: {
          ...(data.receivedItemId !== undefined
            ? { receivedItemId: nextItemId }
            : {}),
          ...(data.itemName !== undefined
            ? { itemName: data.itemName.trim() }
            : {}),
          ...(data.equipmentType !== undefined
            ? { equipmentType: data.equipmentType.trim() }
            : {}),
          ...(data.assetNumber !== undefined
            ? { assetNumber: data.assetNumber.trim() }
            : {}),
          ...(data.serialNumber !== undefined
            ? { serialNumber: data.serialNumber?.trim() || null }
            : {}),
          ...(data.problem !== undefined
            ? { problem: data.problem.trim() }
            : {}),
          ...(data.description !== undefined
            ? { description: data.description?.trim() || null }
            : {}),
          ...(data.dateReported !== undefined
            ? { dateReported: parseDateOnly(data.dateReported) }
            : {}),
          ...(data.reportedBy !== undefined
            ? { reportedBy: data.reportedBy.trim() }
            : {}),
          ...(data.location !== undefined
            ? { location: data.location.trim() }
            : {}),
          ...(data.priority !== undefined ? { priority: data.priority } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.assignedTechnician !== undefined
            ? { assignedTechnician: nextTechnician }
            : {}),
          ...(data.diagnosticFindings !== undefined
            ? { diagnosticFindings: nextDiagnostic }
            : {}),
          ...(data.actionTaken !== undefined
            ? { actionTaken: data.actionTaken?.trim() || null }
            : {}),
          ...(data.partsReplaced !== undefined
            ? { partsReplaced: nextParts }
            : {}),
          ...(data.repairCost !== undefined
            ? {
                repairCost:
                  data.repairCost === "" || data.repairCost === undefined
                    ? null
                    : Number(data.repairCost),
              }
            : {}),
          ...(data.dateSentForRepair !== undefined
            ? {
                dateSentForRepair: data.dateSentForRepair
                  ? parseDateOnly(data.dateSentForRepair)
                  : null,
              }
            : {}),
          ...(data.dateCompleted !== undefined
            ? {
                dateCompleted: data.dateCompleted
                  ? parseDateOnly(data.dateCompleted)
                  : nextStatus === "COMPLETED"
                    ? existing.dateCompleted ?? new Date()
                    : null,
              }
            : nextStatus === "COMPLETED" && !existing.dateCompleted
              ? { dateCompleted: new Date() }
              : {}),
          ...(data.vendor !== undefined
            ? { vendor: data.vendor?.trim() || null }
            : {}),
          ...(data.warranty !== undefined
            ? { warranty: data.warranty?.trim() || null }
            : {}),
          ...(data.remarks !== undefined ? { remarks: nextRemarks } : {}),
          ...(attachment === null
            ? {
                attachmentData: null,
                attachmentMimeType: null,
                attachmentName: null,
              }
            : attachment
              ? {
                  attachmentData: Buffer.from(attachment.data),
                  attachmentMimeType: attachment.mimeType,
                  attachmentName: attachment.name,
                }
              : {}),
        },
      });

      const events = buildUpdateEvents(
        existing,
        {
          status: nextStatus,
          assignedTechnician: nextTechnician,
          diagnosticFindings: nextDiagnostic,
          partsReplaced: nextParts,
          remarks: nextRemarks,
        },
        session.username
      );

      await tx.maintenanceEvent.createMany({
        data: events.map((event) => ({
          maintenanceId: record.id,
          eventType: event.eventType,
          message: event.message,
          createdBy: event.createdBy ?? null,
        })),
      });

      if (previousItemId && previousItemId !== nextItemId) {
        await syncItemAssetStatus(tx, previousItemId, "AVAILABLE");
      }
      await syncItemAssetStatus(tx, nextItemId, restoreStatus);

      return tx.maintenanceRecord.findUniqueOrThrow({
        where: { id: record.id },
        include: maintenanceDetailInclude,
      });
    });

    return NextResponse.json(serializeMaintenance(updated));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update maintenance record" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireInventorySession();
    const { id } = await context.params;

    const existing = await prisma.maintenanceRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = maintenanceStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const status = parsed.data.status as MaintenanceStatusValue;
    const restoreStatus =
      parsed.data.restoreAssetStatus ?? defaultRestoreStatus(status);
    const nextTechnician =
      parsed.data.assignedTechnician !== undefined
        ? parsed.data.assignedTechnician.trim() || null
        : existing.assignedTechnician;
    const nextRemarks =
      parsed.data.remarks !== undefined
        ? parsed.data.remarks.trim() || existing.remarks
        : existing.remarks;

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.update({
        where: { id },
        data: {
          status,
          assignedTechnician: nextTechnician,
          remarks: nextRemarks,
          dateSentForRepair:
            parsed.data.dateSentForRepair !== undefined
              ? parsed.data.dateSentForRepair
                ? parseDateOnly(parsed.data.dateSentForRepair)
                : null
              : existing.dateSentForRepair,
          dateCompleted: parsed.data.dateCompleted
            ? parseDateOnly(parsed.data.dateCompleted)
            : status === "COMPLETED" && !existing.dateCompleted
              ? new Date()
              : status !== "COMPLETED" && isActiveMaintenanceStatus(status)
                ? existing.dateCompleted
                : existing.dateCompleted,
        },
      });

      const events = buildUpdateEvents(
        existing,
        {
          status,
          assignedTechnician: nextTechnician,
          diagnosticFindings: existing.diagnosticFindings,
          partsReplaced: existing.partsReplaced,
          remarks: nextRemarks,
        },
        session.username
      );

      await tx.maintenanceEvent.createMany({
        data: events.map((event) => ({
          maintenanceId: record.id,
          eventType: event.eventType,
          message: event.message,
          createdBy: event.createdBy ?? null,
        })),
      });

      await syncItemAssetStatus(tx, existing.receivedItemId, restoreStatus);

      return tx.maintenanceRecord.findUniqueOrThrow({
        where: { id: record.id },
        include: maintenanceDetailInclude,
      });
    });

    return NextResponse.json(serializeMaintenance(updated));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update maintenance status" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireInventorySession();
    const { id } = await context.params;

    const existing = await prisma.maintenanceRecord.findUnique({
      where: { id },
      select: { id: true, receivedItemId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.maintenanceRecord.delete({ where: { id } });
      await syncItemAssetStatus(tx, existing.receivedItemId, "AVAILABLE");
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete maintenance record" },
      { status: 500 }
    );
  }
}
