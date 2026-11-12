import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { clearAvailableInkStock } from "@/lib/ink-stock";

export async function DELETE(request: NextRequest) {
  try {
    await requireInventorySession();
    const body = await request.json().catch(() => ({}));
    const modelName = typeof body?.modelName === "string" ? body.modelName.trim() : "";
    // Clearing everything must be asked for explicitly; an empty or malformed
    // body is rejected instead of wiping all ink stock.
    const result = await clearAvailableInkStock(
      modelName ? { modelName } : { all: body?.all === true }
    );
    return NextResponse.json(result);
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to clear available ink");
  }
}
