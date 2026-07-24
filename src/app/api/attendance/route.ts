import { NextRequest, NextResponse } from "next/server";
import {
  assertDepartmentAccess,
  getStudentDepartmentFilter,
  isSuperAdmin,
  requireSession,
  requireSuperAdmin,
} from "@/lib/auth";
import {
  recordAttendanceAction,
  resetTodayAttendance,
} from "@/lib/attendance";
import { computeStudentAttendanceStats } from "@/lib/attendance-stats";
import { prisma } from "@/lib/db";
import { formatManilaDateInput, getTodayStart } from "@/lib/date-utils";
import { resolveDepartmentScope } from "@/lib/department-scope";
import {
  attendanceActionSchema,
  attendanceResetSchema,
} from "@/lib/validations";

async function assertStudentAccess(
  session: Awaited<ReturnType<typeof requireSession>>,
  studentDbId: string
) {
  const student = await prisma.student.findUnique({
    where: { id: studentDbId },
    select: { department: true },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  assertDepartmentAccess(session, student.department);
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

    const studentId = searchParams.get("studentId");
    const today = searchParams.get("today") === "true";
    const canResetAttendance = isSuperAdmin(session);

    if (studentId) {
      await assertStudentAccess(session, studentId);

      const records = await prisma.attendanceRecord.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
        take: 30,
      });
      return NextResponse.json(records);
    }

    if (today) {
      const todayStart = getTodayStart();
      const students = await prisma.student.findMany({
        where: { isActive: true, ...departmentFilter },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        include: {
          scheduleSlots: true,
          attendance: {
            orderBy: { date: "asc" },
          },
        },
      });

      const data = students.map((student) => {
        const todayKey = formatManilaDateInput(todayStart);
        const todayRecord =
          student.attendance.find(
            (record) => formatManilaDateInput(record.date) === todayKey
          ) ?? null;
        const stats = computeStudentAttendanceStats(
          student.scheduleSlots,
          student.attendance,
          { createdAt: student.createdAt }
        );

        const { attendance: _attendance, scheduleSlots: _slots, ...rest } =
          student;

        return {
          ...rest,
          todayRecord,
          stats,
        };
      });

      return NextResponse.json({ students: data, canResetAttendance });
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        student: departmentFilter,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body = await request.json();
    const parsed = attendanceActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await assertStudentAccess(session, parsed.data.studentId);

    const result = await recordAttendanceAction(
      parsed.data.studentId,
      parsed.data.action
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const parsed = attendanceResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const result = await resetTodayAttendance(parsed.data.studentId);
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
      { error: "Failed to reset attendance" },
      { status: 500 }
    );
  }
}
