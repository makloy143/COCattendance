import { NextRequest, NextResponse } from "next/server";
import { requireChecksSession } from "@/lib/checks-auth";
import {
  getCheckItemsForDate,
  getChecksDashboardData,
  upsertCheckLog,
} from "@/lib/checks";
import { getTodayStart } from "@/lib/date-utils";
import { checkLogSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireChecksSession();
    const [dashboard, items] = await Promise.all([
      getChecksDashboardData(),
      getCheckItemsForDate(getTodayStart()),
    ]);

    return NextResponse.json({
      ...dashboard,
      items,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Checks GET error:", error);
    return NextResponse.json({ error: "Failed to load checks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireChecksSession();
    const body = await request.json();
    const parsed = checkLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const log = await upsertCheckLog(parsed.data);
    return NextResponse.json({
      id: log.id,
      status: log.status,
      checkDate: log.checkDate,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Checks POST error:", error);
    return NextResponse.json({ error: "Failed to save check" }, { status: 500 });
  }
}
