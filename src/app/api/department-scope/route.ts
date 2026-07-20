import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin, requireSession } from "@/lib/auth";
import {
  setDepartmentScopeCookie,
} from "@/lib/department-scope";
import { listDepartmentOptions } from "@/lib/departments-server";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const department =
      typeof body.department === "string" ? body.department.trim() : "";

    if (!department) {
      await setDepartmentScopeCookie(null);
      return NextResponse.json({ department: null });
    }

    const departments = await listDepartmentOptions();
    if (!departments.some((item) => item.code === department)) {
      return NextResponse.json(
        { error: "Invalid department" },
        { status: 400 }
      );
    }

    await setDepartmentScopeCookie(department);
    return NextResponse.json({ department });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update department scope" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await requireSession();
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await setDepartmentScopeCookie(null);
    return NextResponse.json({ department: null });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to clear department scope" },
      { status: 500 }
    );
  }
}
