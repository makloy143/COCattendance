import { NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import {
  createInventoryDepartment,
  listActiveDepartmentNames,
  listInventoryDepartments,
} from "@/lib/inventory-departments";
import { inventoryDepartmentSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    await requireInventorySession();
    const all = new URL(request.url).searchParams.get("all") === "true";
    if (all) {
      const departments = await listInventoryDepartments();
      return NextResponse.json(departments);
    }
    const names = await listActiveDepartmentNames();
    return NextResponse.json(names);
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to load departments");
  }
}

export async function POST(request: Request) {
  try {
    await requireInventorySession();
    const body = await request.json();
    const parsed = inventoryDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const department = await createInventoryDepartment(parsed.data.name);
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to add department");
  }
}
