import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getTodayStart, getTotalMinutes } from "@/lib/date-utils";
import { readStudentPhoto, studentPhotoUrl } from "@/lib/uploads";
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        scheduleSlots: { orderBy: { dayOfWeek: "asc" } },
        attendance: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const [todayRecord, completedAttendance] = await Promise.all([
      prisma.attendanceRecord.findUnique({
        where: {
          studentId_date: {
            studentId: id,
            date: getTodayStart(),
          },
        },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          studentId: id,
          timeIn: { not: null },
          timeOut: { not: null },
        },
        select: {
          timeIn: true,
          timeOut: true,
        },
      }),
    ]);

    return NextResponse.json({
      ...student,
      todayRecord,
      totalMinutes: getTotalMinutes(completedAttendance),
      canResetAttendance: isSuperAdmin(session),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

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
      assignment: formData.get("assignment") ?? "COMLAB",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const scheduleParsed = parseScheduleFromFormData(formData);
    if (!scheduleParsed.success) {
      return NextResponse.json({ error: scheduleParsed.error }, { status: 400 });
    }

    if (parsed.data.studentId !== existing.studentId) {
      const duplicate = await prisma.student.findUnique({
        where: { studentId: parsed.data.studentId },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Student ID already exists" },
          { status: 400 }
        );
      }
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

    if (photoData) {
      await prisma.studentPhoto.upsert({
        where: { studentId: id },
        create: {
          studentId: id,
          data: photoData.data,
          mimeType: photoData.mimeType,
        },
        update: {
          data: photoData.data,
          mimeType: photoData.mimeType,
        },
      });
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        course: parsed.data.course || null,
        yearLevel: parsed.data.yearLevel || null,
        photoUrl: photoData ? studentPhotoUrl(id) : existing.photoUrl,
        ...(photoData ? { faceDescriptor: Prisma.DbNull } : {}),
        scheduleSlots: {
          deleteMany: {},
          create: scheduleCreateInput(scheduleParsed.data),
        },
      },
      include: {
        scheduleSlots: { orderBy: { dayOfWeek: "asc" } },
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;
    const body = await request.json();

    const student = await prisma.student.update({
      where: { id },
      data: { isActive: Boolean(body.isActive) },
    });

    return NextResponse.json(student);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update student status" },
      { status: 500 }
    );
  }
}
