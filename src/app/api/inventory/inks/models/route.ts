import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { createInkModel } from "@/lib/ink-settings";
import { inkModelSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    await requireInventorySession();
    const body = await request.json();
    const parsed = inkModelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const option = await createInkModel(parsed.data);
    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to add ink model");
  }
}
