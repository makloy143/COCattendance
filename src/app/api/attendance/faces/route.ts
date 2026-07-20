import { NextRequest, NextResponse } from "next/server";
import { getStudentDepartmentFilter, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveDepartmentScope } from "@/lib/department-scope";

function parseDescriptor(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length !== 128) return null;
  if (!value.every((item) => typeof item === "number" && Number.isFinite(item))) {
    return null;
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const departmentScope = await resolveDepartmentScope(
      session,
      searchParams.get("department")
    );
    const departmentFilter = getStudentDepartmentFilter(
      session,
      departmentScope
    );

    const students = await prisma.student.findMany({
      where: { isActive: true, ...departmentFilter },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        faceDescriptor: true,
        photo: { select: { studentId: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const enrolled = [];
    const pending = [];

    for (const student of students) {
      const descriptor = parseDescriptor(student.faceDescriptor);
      const base = {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        photoUrl: student.photoUrl,
      };

      if (descriptor) {
        enrolled.push({ ...base, descriptor });
        continue;
      }

      if (student.photo || student.photoUrl) {
        pending.push(base);
      }
    }

    return NextResponse.json({
      enrolled,
      pending,
      enrolledCount: enrolled.length,
      pendingCount: pending.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load face data" },
      { status: 500 }
    );
  }
}
