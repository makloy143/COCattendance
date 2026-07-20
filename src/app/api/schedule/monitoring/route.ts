import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getManilaDayStart, getTodayStart } from "@/lib/date-utils";
import { resolveDepartmentScope } from "@/lib/department-scope";
import { getScheduleMonitoringData } from "@/lib/schedule-monitoring";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const departmentScope = await resolveDepartmentScope(
      session,
      searchParams.get("department")
    );

    const viewDate =
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
        ? getManilaDayStart(dateParam)
        : getTodayStart();

    const data = await getScheduleMonitoringData(
      session,
      viewDate,
      departmentScope
    );

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch schedule monitoring data" },
      { status: 500 }
    );
  }
}
