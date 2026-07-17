import { NextResponse } from "next/server";
import { assertDepartmentAccess, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateQrPngBuffer } from "@/lib/qr";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    const student = await prisma.student.findUnique({
      where: { id },
      select: { qrToken: true, isActive: true, department: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    assertDepartmentAccess(session, student.department);

    const buffer = await generateQrPngBuffer(student.qrToken);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
