import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { removeInkRelease } from "@/lib/ink-stock";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    const result = await removeInkRelease(id);
    return NextResponse.json(result);
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to remove ink release");
  }
}
