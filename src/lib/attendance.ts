import { prisma } from "@/lib/db";
import { getTodayStart } from "@/lib/date-utils";

const MIN_TIME_OUT_INTERVAL_MINUTES = 30;

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

type StudentAttendanceProfile = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
};

function assertMinTimeOutInterval(timeIn: Date, now: Date) {
  const elapsedMinutes = (now.getTime() - timeIn.getTime()) / 60000;

  if (elapsedMinutes < MIN_TIME_OUT_INTERVAL_MINUTES) {
    const remainingMinutes = Math.ceil(
      MIN_TIME_OUT_INTERVAL_MINUTES - elapsedMinutes
    );
    throw new Error(
      `Must wait at least ${MIN_TIME_OUT_INTERVAL_MINUTES} minutes after time in before timing out. Please wait ${remainingMinutes} more minute${remainingMinutes === 1 ? "" : "s"}.`
    );
  }
}

async function recordAttendanceByStudentId(
  studentDbId: string
): Promise<AttendanceResult> {
  const todayStart = getTodayStart();
  const now = new Date();

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      studentId_date: {
        studentId: studentDbId,
        date: todayStart,
      },
    },
  });

  if (!existing?.timeIn) {
    const record = await prisma.attendanceRecord.upsert({
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

    return {
      record,
      message: "Time in recorded",
      action: "timeIn",
    };
  }

  if (!existing.timeOut) {
    assertMinTimeOutInterval(existing.timeIn, now);

    const record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { timeOut: now },
    });

    return {
      record,
      message: "Time out recorded",
      action: "timeOut",
    };
  }

  throw new Error("Attendance already completed for today");
}

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

  assertMinTimeOutInterval(record.timeIn, now);

  record = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { timeOut: now },
  });

  return { record, message: "Time out recorded", action: "timeOut" };
}

export async function recordAttendanceScan(qrToken: string): Promise<
  AttendanceResult & { student: StudentAttendanceProfile }
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

  const result = await recordAttendanceByStudentId(student.id);
  return { ...result, student };
}

export async function recordAttendanceRecognize(
  studentDbId: string
): Promise<AttendanceResult & { student: StudentAttendanceProfile }> {
  const student = await prisma.student.findUnique({
    where: { id: studentDbId, isActive: true },
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      faceDescriptor: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  if (!student.faceDescriptor) {
    throw new Error("Student has no enrolled face");
  }

  const result = await recordAttendanceByStudentId(student.id);
  return {
    ...result,
    student: {
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      photoUrl: student.photoUrl,
    },
  };
}
