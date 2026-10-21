import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { removeInventoryDepartment, updateInventoryDepartment } from "@/lib/inventory-departments";
import { inventoryDepartmentUpdateSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    const body = await request.json();
    const parsed = inventoryDepartmentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const department = await updateInventoryDepartment(id, parsed.data);
    return NextResponse.json(department);
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to update department");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInventorySession();
    const { id } = await params;
    const result = await removeInventoryDepartment(id);
    return NextResponse.json(result);
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to remove department");
  }
}
