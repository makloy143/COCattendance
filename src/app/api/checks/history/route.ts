import { NextResponse } from "next/server";
import { requireChecksSession } from "@/lib/checks-auth";
import { getCheckHistory } from "@/lib/checks";

export async function GET() {
  try {
    await requireChecksSession();
    const logs = await getCheckHistory();
    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Check history GET error:", error);
    return NextResponse.json(
      { error: "Failed to load history" },
      { status: 500 }
    );
  }
}
