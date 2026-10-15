import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { removeIdItemOption, updateIdItemOption } from "@/lib/id-maintenance-data";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { idItemTypeUpdateSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    const body = await request.json();
    const parsed = idItemTypeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const option = await updateIdItemOption(id, parsed.data);
    return NextResponse.json(option);
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to update item type");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    const result = await removeIdItemOption(id);
    return NextResponse.json(result);
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to remove item type");
  }
}
