import { NextRequest, NextResponse } from "next/server";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { requireSession } from "@/lib/auth";
import {
  buildExcelBuffer,
  buildPdfBuffer,
  buildReportFilename,
  fetchAttendanceReport,
  parseReportDate,
  type ReportFilters,
} from "@/lib/reports";

export async function GET(request: NextRequest) {
  try {
    await requireSession();

    const { searchParams } = new URL(request.url);
    const today = startOfDay(new Date());
    const defaultFrom = subDays(today, 30);

    const from = parseReportDate(searchParams.get("from") ?? "", defaultFrom);
    const to = parseReportDate(searchParams.get("to") ?? "", today);

    if (from > to) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    const filters: ReportFilters = {
      from: startOfDay(from),
      to: endOfDay(to),
      studentId: searchParams.get("studentId")?.trim() || undefined,
      course: searchParams.get("course")?.trim() || undefined,
      status:
        (searchParams.get("status") as ReportFilters["status"]) || "all",
    };

    const rows = await fetchAttendanceReport(filters);
    const format = searchParams.get("format") ?? "json";

    if (format === "json") {
      return NextResponse.json({
        rows,
        total: rows.length,
        filters: {
          from: filters.from.toISOString(),
          to: filters.to.toISOString(),
          studentId: filters.studentId ?? null,
          course: filters.course ?? null,
          status: filters.status ?? "all",
        },
      });
    }

    if (format === "xlsx" || format === "xls") {
      const buffer = buildExcelBuffer(rows, filters);
      const filename = buildReportFilename(filters, "xls");

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "pdf") {
      const buffer = buildPdfBuffer(rows, filters);
      const filename = buildReportFilename(filters, "pdf");

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
