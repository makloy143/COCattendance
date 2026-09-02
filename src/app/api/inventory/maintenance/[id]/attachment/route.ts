import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireInventorySession();
    const { id } = await context.params;

    const record = await prisma.maintenanceRecord.findUnique({
      where: { id },
      select: {
        attachmentData: true,
        attachmentMimeType: true,
        attachmentName: true,
      },
    });

    if (!record?.attachmentData || !record.attachmentMimeType) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    const filename = record.attachmentName ?? "attachment";

    return new NextResponse(new Uint8Array(record.attachmentData), {
      headers: {
        "Content-Type": record.attachmentMimeType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load attachment" },
      { status: 500 }
    );
  }
}
