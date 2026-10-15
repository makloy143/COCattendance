import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { createIdReleaseEntry } from "@/lib/id-maintenance-data";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { idReleaseEntrySchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    await requireInventorySession();
    const body = await request.json();
    const parsed = idReleaseEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const record = await createIdReleaseEntry(parsed.data);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to record ID release");
  }
}
