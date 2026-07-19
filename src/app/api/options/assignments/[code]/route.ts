import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catalogOptionUpdateSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireSuperAdmin();
    const { code } = await context.params;

    const existing = await prisma.studentAssignmentOption.findUnique({
      where: { code },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Assign-to option not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = catalogOptionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    if (
      parsed.data.label === undefined &&
      parsed.data.isActive === undefined
    ) {
      return NextResponse.json(
        { error: "No changes provided" },
        { status: 400 }
      );
    }

    const option = await prisma.studentAssignmentOption.update({
      where: { code },
      data: {
        ...(parsed.data.label !== undefined
          ? { label: parsed.data.label.trim() }
          : {}),
        ...(parsed.data.isActive !== undefined
          ? { isActive: parsed.data.isActive }
          : {}),
      },
    });

    return NextResponse.json(option);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to update assign-to option" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireSuperAdmin();
    const { code } = await context.params;

    const existing = await prisma.studentAssignmentOption.findUnique({
      where: { code },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Assign-to option not found" },
        { status: 404 }
      );
    }

    const studentCount = await prisma.student.count({
      where: { assignment: code },
    });

    if (studentCount > 0) {
      const option = await prisma.studentAssignmentOption.update({
        where: { code },
        data: { isActive: false },
      });
      return NextResponse.json({
        ...option,
        deactivated: true,
        message:
          "Assign-to option is in use, so it was deactivated instead of deleted",
      });
    }

    await prisma.studentAssignmentOption.delete({ where: { code } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to delete assign-to option" },
      { status: 500 }
    );
  }
}
