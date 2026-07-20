import { NextRequest, NextResponse } from "next/server";
import {
  getStudentDepartmentFilter,
  requireSession,
  resolveStudentDepartment,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDurationMinutes } from "@/lib/date-utils";
import { resolveDepartmentScope } from "@/lib/department-scope";
import { readStudentPhoto, studentPhotoUrl } from "@/lib/uploads";
import { assertActiveDepartment } from "@/lib/departments-server";
import { assertActiveAssignment } from "@/lib/student-assignment-server";
import { parseScheduleFromFormData, studentSchema } from "@/lib/validations";

function scheduleCreateInput(
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isEnabled: boolean;
  }[]
) {
  return schedule.map((slot) => ({
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isEnabled: slot.isEnabled,
  }));
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

    const search = searchParams.get("search")?.trim();
    const includeInactive = searchParams.get("includeInactive") === "true";

    const students = await prisma.student.findMany({
      where: {
        ...departmentFilter,
        ...(includeInactive ? {} : { isActive: true }),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { studentId: { contains: search, mode: "insensitive" } },
                { course: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: students.map((student) => student.id) },
        timeIn: { not: null },
        timeOut: { not: null },
      },
      select: {
        studentId: true,
        timeIn: true,
        timeOut: true,
      },
    });

    const totalMinutesByStudent = new Map<string, number>();
    for (const record of attendanceRecords) {
      const minutes = getDurationMinutes(record.timeIn, record.timeOut);
      totalMinutesByStudent.set(
        record.studentId,
        (totalMinutesByStudent.get(record.studentId) ?? 0) + minutes
      );
    }

    return NextResponse.json(
      students.map((student) => ({
        ...student,
        totalMinutes: totalMinutesByStudent.get(student.id) ?? 0,
      }))
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const formData = await request.formData();
    const photo = formData.get("photo");

    const parsed = studentSchema.safeParse({
      studentId: formData.get("studentId"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email") ?? "",
      phone: formData.get("phone") ?? "",
      course: formData.get("course") ?? "",
      yearLevel: formData.get("yearLevel") ?? "",
      studentType: formData.get("studentType") ?? "SA",
      assignment: formData.get("assignment") ?? "REGISTRAR",
      department: formData.get("department"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const department = resolveStudentDepartment(
      session,
      parsed.data.department
    );

    try {
      await assertActiveDepartment(department);
      await assertActiveAssignment(parsed.data.assignment);
    } catch (validationError) {
      return NextResponse.json(
        {
          error:
            validationError instanceof Error
              ? validationError.message
              : "Invalid department or assignment",
        },
        { status: 400 }
      );
    }

    const scheduleParsed = parseScheduleFromFormData(formData);
    if (!scheduleParsed.success) {
      return NextResponse.json({ error: scheduleParsed.error }, { status: 400 });
    }

    const existing = await prisma.student.findUnique({
      where: {
        department_studentId: {
          department,
          studentId: parsed.data.studentId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Student ID already exists in this department" },
        { status: 400 }
      );
    }

    let photoData: Awaited<ReturnType<typeof readStudentPhoto>> | null = null;
    if (photo instanceof File && photo.size > 0) {
      try {
        photoData = await readStudentPhoto(photo);
      } catch (uploadError) {
        return NextResponse.json(
          {
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "Photo upload failed",
          },
          { status: 400 }
        );
      }
    }

    const student = await prisma.student.create({
      data: {
        ...parsed.data,
        department,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        course: parsed.data.course || null,
        yearLevel: parsed.data.yearLevel || null,
        ...(photoData
          ? {
              photo: {
                create: {
                  data: photoData.data,
                  mimeType: photoData.mimeType,
                },
              },
            }
          : {}),
        scheduleSlots: {
          create: scheduleCreateInput(scheduleParsed.data),
        },
      },
      include: {
        scheduleSlots: { orderBy: { dayOfWeek: "asc" } },
      },
    });

    if (photoData) {
      const updated = await prisma.student.update({
        where: { id: student.id },
        data: { photoUrl: studentPhotoUrl(student.id) },
        include: {
          scheduleSlots: { orderBy: { dayOfWeek: "asc" } },
        },
      });
      return NextResponse.json(updated, { status: 201 });
    }

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}