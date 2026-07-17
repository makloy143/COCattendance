import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChecksSession } from "@/lib/checks-auth";
import { listCheckTemplates } from "@/lib/checks";
import {
  checkTemplateSchema,
  checkTemplateUpdateSchema,
} from "@/lib/validations";

export async function GET() {
  try {
    await requireChecksSession();
    const templates = await listCheckTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Check templates GET error:", error);
    return NextResponse.json(
      { error: "Failed to load schedules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireChecksSession();
    const body = await request.json();
    const parsed = checkTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const maxSort = await prisma.checkTemplate.aggregate({
      _max: { sortOrder: true },
    });

    const template = await prisma.checkTemplate.create({
      data: {
        department: parsed.data.department,
        title: parsed.data.title,
        description: parsed.data.description?.trim() || null,
        category: parsed.data.category,
        cadence: parsed.data.cadence,
        dayOfWeek:
          parsed.data.cadence === "WEEKLY" ? parsed.data.dayOfWeek ?? 1 : null,
        dayOfMonth:
          parsed.data.cadence === "MONTHLY"
            ? parsed.data.dayOfMonth ?? 1
            : null,
        sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Check templates POST error:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireChecksSession();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }

    const parsed = checkTemplateUpdateSchema.safeParse(updates);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await prisma.checkTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const cadence = parsed.data.cadence ?? existing.cadence;

    const template = await prisma.checkTemplate.update({
      where: { id },
      data: {
        ...parsed.data,
        description:
          parsed.data.description !== undefined
            ? parsed.data.description?.trim() || null
            : undefined,
        dayOfWeek:
          cadence === "WEEKLY"
            ? parsed.data.dayOfWeek ?? existing.dayOfWeek ?? 1
            : null,
        dayOfMonth:
          cadence === "MONTHLY"
            ? parsed.data.dayOfMonth ?? existing.dayOfMonth ?? 1
            : null,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Check templates PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireChecksSession();
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }

    await prisma.checkTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Check templates DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
