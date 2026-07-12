import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { recordAttendanceRecognize } from "@/lib/attendance";
import { attendanceRecognizeSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    await requireSession();

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

    const result = await recordAttendanceRecognize(parsed.data.studentId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
