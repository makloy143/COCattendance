import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import {
  deleteIdBadPrint,
  updateIdBadPrintStatus,
} from "@/lib/id-maintenance-data";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { idBadPrintStatusSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    const body = await request.json();
    const parsed = idBadPrintStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const record = await updateIdBadPrintStatus(id, parsed.data.status);
    return NextResponse.json(record);
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to update bad printing record");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    await deleteIdBadPrint(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to remove bad printing record");
  }
}
