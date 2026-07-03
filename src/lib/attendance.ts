import { prisma } from "@/lib/db";
import { getTodayStart } from "@/lib/date-utils";

export type AttendanceResult = {
  record: {
    id: string;
    studentId: string;
    date: Date;
    timeIn: Date | null;
    timeOut: Date | null;
  };
  message: string;
  action: "timeIn" | "timeOut";
};

export async function recordAttendanceAction(
  studentDbId: string,
  action: "timeIn" | "timeOut"
): Promise<AttendanceResult> {
  const todayStart = getTodayStart();
  const now = new Date();

  const student = await prisma.student.findUnique({
    where: { id: studentDbId, isActive: true },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  let record = await prisma.attendanceRecord.findUnique({
    where: {
      studentId_date: {
        studentId: studentDbId,
        date: todayStart,
      },
    },
  });

  if (action === "timeIn") {
    if (record?.timeIn) {
      throw new Error("Student already timed in today");
    }

    record = await prisma.attendanceRecord.upsert({
      where: {
        studentId_date: {
          studentId: studentDbId,
          date: todayStart,
        },
      },
      update: { timeIn: now },
      create: {
        studentId: studentDbId,
        date: todayStart,
        timeIn: now,
      },
    });

    return { record, message: "Time in recorded", action: "timeIn" };
  }

  if (!record?.timeIn) {
    throw new Error("Student must time in first");
  }

  if (record.timeOut) {
    throw new Error("Student already timed out today");
  }

  record = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { timeOut: now },
  });

  return { record, message: "Time out recorded", action: "timeOut" };
}

export async function recordAttendanceScan(qrToken: string): Promise<
  AttendanceResult & {
    student: {
      id: string;
      studentId: string;
      firstName: string;
      lastName: string;
      photoUrl: string | null;
    };
  }
> {
  const student = await prisma.student.findUnique({
    where: { qrToken, isActive: true },
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
    },
  });

  if (!student) {
    throw new Error("Invalid QR code");
  }

  const todayStart = getTodayStart();
  const now = new Date();

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      studentId_date: {
        studentId: student.id,
        date: todayStart,
      },
    },
  });

  if (!existing?.timeIn) {
    const record = await prisma.attendanceRecord.upsert({
      where: {
        studentId_date: {
          studentId: student.id,
          date: todayStart,
        },
      },
      update: { timeIn: now },
      create: {
        studentId: student.id,
        date: todayStart,
        timeIn: now,
      },
    });

    return {
      student,
      record,
      message: "Time in recorded",
      action: "timeIn",
    };
  }

  if (!existing.timeOut) {
    const record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { timeOut: now },
    });

    return {
      student,
      record,
      message: "Time out recorded",
      action: "timeOut",
    };
  }

  throw new Error("Attendance already completed for today");
}
