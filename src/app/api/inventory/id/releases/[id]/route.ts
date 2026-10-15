import { NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { deleteIdReleaseEntry } from "@/lib/id-maintenance-data";
import { inventoryErrorResponse } from "@/lib/inventory-api";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    await deleteIdReleaseEntry(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to remove ID release");
  }
}
