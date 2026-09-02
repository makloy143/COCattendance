import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import {
  buildMaintenanceWhere,
  maintenanceItemInclude,
  maintenanceRecordsToCsv,
  serializeMaintenance,
  type MaintenanceListFilters,
} from "@/lib/maintenance";
import {
  isMaintenancePriority,
  isMaintenanceStatus,
} from "@/lib/maintenance-shared";

function filtersFromRequest(request: NextRequest): MaintenanceListFilters {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim().toUpperCase();
  const priority = searchParams.get("priority")?.trim().toUpperCase();

  return {
    search: searchParams.get("search")?.trim() || undefined,
    status: status && isMaintenanceStatus(status) ? status : undefined,
    priority:
      priority && isMaintenancePriority(priority) ? priority : undefined,
    equipmentType: searchParams.get("equipmentType")?.trim() || undefined,
    location: searchParams.get("location")?.trim() || undefined,
    dateFrom: searchParams.get("dateFrom")?.trim() || undefined,
    dateTo: searchParams.get("dateTo")?.trim() || undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireInventorySession();
    const filters = filtersFromRequest(request);

    const records = await prisma.maintenanceRecord.findMany({
      where: buildMaintenanceWhere(filters),
      include: maintenanceItemInclude,
      orderBy: [{ dateReported: "desc" }, { createdAt: "desc" }],
    });

    const csv = maintenanceRecordsToCsv(records.map(serializeMaintenance));

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="maintenance-records.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to export maintenance records" },
      { status: 500 }
    );
  }
}
