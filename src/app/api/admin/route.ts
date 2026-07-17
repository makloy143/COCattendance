import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adminAccountSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireSuperAdmin();

    const admins = await prisma.admin.findMany({
      orderBy: [{ role: "desc" }, { username: "asc" }],
      select: {
        id: true,
        username: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    return NextResponse.json(admins);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch admin accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const parsed = adminAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await prisma.admin.findUnique({
      where: { username: parsed.data.username },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const admin = await prisma.admin.create({
      data: {
        username: parsed.data.username,
        passwordHash,
        role: parsed.data.role,
        department:
          parsed.data.role === "ADMIN" ? parsed.data.department : null,
      },
      select: {
        id: true,
        username: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    return NextResponse.json(admin, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to create admin account" },
      { status: 500 }
    );
  }
}
