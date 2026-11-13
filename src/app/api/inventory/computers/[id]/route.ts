import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { deleteComputer, updateComputer } from "@/lib/computers-data";
import { computerSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireInventorySession();
    const { id } = await params;
    const parsed = computerSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    return NextResponse.json(await updateComputer(id, parsed.data, session.username));
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to update computer");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    return NextResponse.json(await deleteComputer(id));
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to remove computer");
  }
}
