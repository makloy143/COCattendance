import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { updateInkOfficeSettings } from "@/lib/ink-settings";
import { inkOfficeSettingsSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest) {
  try {
    await requireInventorySession();
    const body = await request.json();
    const parsed = inkOfficeSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const settings = await updateInkOfficeSettings(parsed.data);
    return NextResponse.json(settings);
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to save ink settings");
  }
}
