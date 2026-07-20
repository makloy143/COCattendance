import { NextRequest, NextResponse } from "next/server";
import { getStudentDepartmentFilter, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayStart } from "@/lib/date-utils";
import { resolveDepartmentScope } from "@/lib/department-scope";

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
    const todayStart = getTodayStart();

    const [totalStudents, todayRecords, recentRecords] = await Promise.all([
      prisma.student.count({ where: { isActive: true, ...departmentFilter } }),
      prisma.attendanceRecord.findMany({
        where: {
          date: todayStart,
          student: departmentFilter,
        },
      }),
      prisma.attendanceRecord.findMany({
        where: { student: departmentFilter },
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
              department: true,
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
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
