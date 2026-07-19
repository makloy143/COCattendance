import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin, requireSession, requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listDepartmentOptions } from "@/lib/departments-server";
import {
  catalogOptionSchema,
  resolveCatalogOptionCode,
} from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const includeInactive =
      request.nextUrl.searchParams.get("all") === "true" &&
      isSuperAdmin(session);

    const options = await listDepartmentOptions({ includeInactive });
    return NextResponse.json(options);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const parsed = catalogOptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const code = resolveCatalogOptionCode(
      parsed.data.label,
      parsed.data.code
    );
    if (!code) {
      return NextResponse.json(
        { error: "Code must contain letters or numbers" },
        { status: 400 }
      );
    }

    const existing = await prisma.attendanceDepartmentOption.findUnique({
      where: { code },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Department already exists" },
        { status: 400 }
      );
    }

    const maxSort = await prisma.attendanceDepartmentOption.aggregate({
      _max: { sortOrder: true },
    });

    const option = await prisma.attendanceDepartmentOption.create({
      data: {
        code,
        label: parsed.data.label.trim(),
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
