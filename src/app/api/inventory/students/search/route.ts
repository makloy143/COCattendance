import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireInventorySession();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const students = await prisma.student.findMany({
      where: {
        isActive: true,
        OR: [
          { studentId: { contains: q } },
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { course: { contains: q } },
        ],
      },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        course: true,
      },
      take: 10,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json(students);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    );
  }
}
