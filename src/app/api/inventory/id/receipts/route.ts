import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { createIdStockReceipt } from "@/lib/id-maintenance-data";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { idStockReceiptSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await requireInventorySession();
    const body = await request.json();
    const parsed = idStockReceiptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const receipt = await createIdStockReceipt({
      ...parsed.data,
      recordedBy: session.username,
    });
    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to record stock receipt");
  }
}
