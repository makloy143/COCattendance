import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayStart } from "@/lib/date-utils";

export async function GET() {
  try {
    await requireSession();
    const todayStart = getTodayStart();

    const [totalStudents, todayRecords, recentRecords] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.attendanceRecord.findMany({
        where: { date: todayStart },
      }),
      prisma.attendanceRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
              studentType: true,
              assignment: true,
            },
          },
        },
      }),
    ]);

    const presentToday = todayRecords.filter((r) => r.timeIn).length;
    const stillIn = todayRecords.filter((r) => r.timeIn && !r.timeOut).length;
    const completed = todayRecords.filter((r) => r.timeIn && r.timeOut).length;

    return NextResponse.json({
      totalStudents,
      presentToday,
      stillIn,
      completed,
      recentRecords,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
