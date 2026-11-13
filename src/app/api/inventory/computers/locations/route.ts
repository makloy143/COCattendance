import { NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { createComputerLocation, listComputerLocations } from "@/lib/computers-data";
import { computerLocationSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireInventorySession();
    return NextResponse.json(await listComputerLocations());
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to load locations");
  }
}

export async function POST(request: Request) {
  try {
    await requireInventorySession();
    const parsed = computerLocationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    return NextResponse.json(await createComputerLocation(parsed.data), { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to add location");
  }
}
