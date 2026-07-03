import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { recordAttendanceAction } from "@/lib/attendance";
import { prisma } from "@/lib/db";
import { getTodayStart } from "@/lib/date-utils";
import { attendanceActionSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    await requireSession();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const today = searchParams.get("today") === "true";

    if (studentId) {
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
        where: { isActive: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        include: {
          attendance: {
            where: { date: todayStart },
            take: 1,
          },
        },
      });

      const data = students.map((student) => ({
        ...student,
        todayRecord: student.attendance[0] ?? null,
      }));

      return NextResponse.json(data);
    }

    const records = await prisma.attendanceRecord.findMany({
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
          },
        },
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const body = await request.json();
    const parsed = attendanceActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const result = await recordAttendanceAction(
      parsed.data.studentId,
      parsed.data.action
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
