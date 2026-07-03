import { NextRequest, NextResponse } from "next/server";
import { requireMonitoringSession } from "@/lib/monitoring-auth";
import {
  buildMonitoringExcelBuffer,
  buildMonitoringFilename,
  getOrCreateDailyReport,
  parseMonitoringDate,
} from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  try {
    await requireMonitoringSession();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "xls";

    if (format !== "xls" && format !== "xlsx") {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const date = parseMonitoringDate(
      searchParams.get("date") ?? "",
      new Date()
    );
    const report = await getOrCreateDailyReport(date);
    const buffer = buildMonitoringExcelBuffer(report);
    const filename = buildMonitoringFilename(report.reportDate);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to export monitoring report" },
      { status: 500 }
    );
  }
}
