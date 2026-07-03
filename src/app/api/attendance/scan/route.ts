import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { recordAttendanceScan } from "@/lib/attendance";
import { parseQrPayload } from "@/lib/qr";
import { attendanceScanSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const body = await request.json();
    const raw = String(body.qrToken ?? body.code ?? "");
    const qrToken = parseQrPayload(raw);

    if (!qrToken) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
    }

    const parsed = attendanceScanSchema.safeParse({ qrToken });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid QR code" },
        { status: 400 }
      );
    }

    const result = await recordAttendanceScan(parsed.data.qrToken);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to scan attendance" },
      { status: 500 }
    );
  }
}
