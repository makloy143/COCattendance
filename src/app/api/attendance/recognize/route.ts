import { NextRequest, NextResponse } from "next/server";
import { assertDepartmentAccess, requireSession } from "@/lib/auth";
import { recordAttendanceRecognize } from "@/lib/attendance";
import { prisma } from "@/lib/db";
import { attendanceRecognizeSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body = await request.json();
    const parsed = attendanceRecognizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Invalid recognition payload",
        },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: parsed.data.studentId, isActive: true },
      select: { department: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    assertDepartmentAccess(session, student.department);

    const result = await recordAttendanceRecognize(parsed.data.studentId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to recognize attendance" },
      { status: 500 }
    );
  }
}
