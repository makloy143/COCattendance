import { NextRequest, NextResponse } from "next/server";
import { assertDepartmentAccess, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { faceEnrollBatchSchema, faceEnrollSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body = await request.json();

    if (Array.isArray(body?.enrollments)) {
      const parsed = faceEnrollBatchSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error:
              parsed.error.issues[0]?.message ?? "Invalid enrollment payload",
          },
          { status: 400 }
        );
      }

      let enrolled = 0;
      const errors: { studentId: string; error: string }[] = [];

      for (const item of parsed.data.enrollments) {
        const student = await prisma.student.findUnique({
          where: { id: item.studentId, isActive: true },
          select: { id: true, department: true },
        });

        if (!student) {
          errors.push({ studentId: item.studentId, error: "Student not found" });
          continue;
        }

        try {
          assertDepartmentAccess(session, student.department);
        } catch {
          errors.push({ studentId: item.studentId, error: "Forbidden" });
          continue;
        }

        await prisma.student.update({
          where: { id: item.studentId },
          data: { faceDescriptor: item.descriptor },
        });
        enrolled += 1;
      }

      return NextResponse.json({ enrolled, errors });
    }

    const parsed = faceEnrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Invalid enrollment payload",
        },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: parsed.data.studentId, isActive: true },
      select: { id: true, department: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    assertDepartmentAccess(session, student.department);

    await prisma.student.update({
      where: { id: parsed.data.studentId },
      data: { faceDescriptor: parsed.data.descriptor },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to enroll face" },
      { status: 500 }
    );
  }
}
