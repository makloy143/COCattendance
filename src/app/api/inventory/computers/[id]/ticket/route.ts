import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { openComputerTicket } from "@/lib/computers-data";
import { computerTicketSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireInventorySession();
    const { id } = await params;
    const parsed = computerTicketSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const ticket = await openComputerTicket(id, parsed.data, session.username);
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to open a maintenance ticket");
  }
}
