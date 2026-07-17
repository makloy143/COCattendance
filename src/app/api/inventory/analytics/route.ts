import { NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getInventoryAnalyticsData } from "@/lib/inventory-analytics";

export async function GET() {
  try {
    await requireInventorySession();
    const data = await getInventoryAnalyticsData();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch inventory analytics" },
      { status: 500 }
    );
  }
}
