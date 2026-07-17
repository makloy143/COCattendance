import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adminAccountUpdateSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSuperAdmin();
    const { id } = await context.params;

    if (id === session.adminId) {
      return NextResponse.json(
        { error: "You cannot modify your own account here" },
        { status: 400 }
      );
    }

    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = adminAccountUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const nextRole = parsed.data.role ?? existing.role;
    const nextDepartment =
      parsed.data.department !== undefined
        ? parsed.data.department
        : existing.department;

    if (nextRole === "ADMIN" && !nextDepartment) {
      return NextResponse.json(
        { error: "Department is required for admin accounts" },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.update({
      where: { id },
      data: {
        ...(parsed.data.role ? { role: parsed.data.role } : {}),
        ...(parsed.data.department !== undefined
          ? {
              department:
                nextRole === "SUPER_ADMIN" ? null : parsed.data.department,
            }
          : parsed.data.role === "SUPER_ADMIN"
            ? { department: null }
            : {}),
        ...(parsed.data.password
          ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) }
          : {}),
      },
      select: {
        id: true,
        username: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    return NextResponse.json(admin);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to update admin account" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSuperAdmin();
    const { id } = await context.params;

    if (id === session.adminId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    await prisma.admin.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to delete admin account" },
      { status: 500 }
    );
  }
}
