import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { removeInkRelease, updateInkReleaseDepartment } from "@/lib/ink-stock";
import { inventoryDepartmentSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    const body = await request.json();
    const parsed = inventoryDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const record = await updateInkReleaseDepartment(id, parsed.data.name);
    return NextResponse.json(record);
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to update the department");
  }
}

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
