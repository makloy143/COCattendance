import { NextRequest, NextResponse } from "next/server";
import { requireMonitoringSession } from "@/lib/monitoring-auth";
import {
  getOrCreateDailyReport,
  parseMonitoringDate,
  saveDailyReport,
} from "@/lib/monitoring";
import { monitoringSaveSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    await requireMonitoringSession();

    const { searchParams } = new URL(request.url);
    const date = parseMonitoringDate(
      searchParams.get("date") ?? "",
      new Date()
    );
    const report = await getOrCreateDailyReport(date);

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load monitoring report" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireMonitoringSession();

    const body = await request.json();
    const parsed = monitoringSaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const date = parseMonitoringDate(parsed.data.date, new Date());
    const report = await saveDailyReport(date, parsed.data.entries, parsed.data.shiftType);

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to save monitoring report" },
      { status: 500 }
    );
  }
}
