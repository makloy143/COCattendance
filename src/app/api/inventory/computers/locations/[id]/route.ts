import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { removeComputerLocation, updateComputerLocation } from "@/lib/computers-data";
import { computerLocationUpdateSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    const parsed = computerLocationUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    return NextResponse.json(await updateComputerLocation(id, parsed.data));
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to update location");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    return NextResponse.json(await removeComputerLocation(id));
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to remove location");
  }
}
