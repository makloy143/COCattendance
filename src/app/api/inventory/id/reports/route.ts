import { NextRequest, NextResponse } from "next/server";
import { buildIdReportWorkbook } from "@/lib/id-report";
import { requireInventorySession } from "@/lib/inventory-auth";

export async function GET(request: NextRequest) {
  try {
    await requireInventorySession();
    const period = new URL(request.url).searchParams.get("period");
    const report = await buildIdReportWorkbook(period);
    return new NextResponse(new Uint8Array(report.buffer), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${report.filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to download the ID report" }, { status: 500 });
  }
}
