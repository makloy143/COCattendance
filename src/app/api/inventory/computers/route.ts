import { NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { createComputer, listComputers } from "@/lib/computers-data";
import { computerSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireInventorySession();
    return NextResponse.json(await listComputers());
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to load computers");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireInventorySession();
    const parsed = computerSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const computer = await createComputer(parsed.data, session.username);
    return NextResponse.json(computer, { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to add computer");
  }
}
