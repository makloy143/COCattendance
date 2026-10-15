import { NextResponse } from "next/server";
import { IdStockError } from "@/lib/id-maintenance";

export function inventoryErrorResponse(error: unknown, fallback: string) {
  if (error instanceof IdStockError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
