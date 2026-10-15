import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { deleteIdSurrender } from "@/lib/id-maintenance-data";
import { inventoryErrorResponse } from "@/lib/inventory-api";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    await deleteIdSurrender(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to remove withdrawal");
  }
}
