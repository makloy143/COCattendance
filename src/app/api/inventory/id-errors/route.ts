import { NextRequest, NextResponse } from "next/server";
import { parseISO, startOfDay } from "date-fns";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import {
  idErrorRecordSchema,
  idErrorStatusUpdateSchema,
} from "@/lib/validations";

function parseDateOnly(value: string): Date {
  return startOfDay(parseISO(value));
}

export async function GET(request: NextRequest) {
  try {
    await requireInventorySession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status")?.trim().toUpperCase();

    const records = await prisma.idErrorRecord.findMany({
      where: {
        ...(status === "REPRINT" ||
        status === "RESOLVED" ||
        status === "CANCELLED"
          ? { status: status as "REPRINT" | "RESOLVED" | "CANCELLED" }
          : {}),
        ...(search
          ? {
              OR: [
                { personName: { contains: search } },
                { course: { contains: search } },
                { idNumber: { contains: search } },
                { reason: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            course: true,
          },
        },
      },
      orderBy: [{ datePrintedError: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(records);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch ID error records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireInventorySession();

    const body = await request.json();
    const parsed = idErrorRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const record = await prisma.idErrorRecord.create({
      data: {
        personName: data.personName.trim(),
        course: data.course.trim(),
        idNumber: data.idNumber.trim(),
        datePrintedError: parseDateOnly(data.datePrintedError),
        status: data.status,
        reason: data.reason.trim(),
        notes: data.notes?.trim() || null,
        studentId: data.studentId?.trim() || null,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            course: true,
          },
        },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create ID error record" },
      { status: 500 }
    );
  }
}
