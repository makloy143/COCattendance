import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import { getAvailableQuantity } from "@/lib/inventory";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireInventorySession();
    const { id } = await context.params;

    const item = await prisma.receivedItem.findUnique({
      where: { id },
      include: {
        borrows: {
          orderBy: [{ dateBorrowed: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...item,
      availableQuantity: getAvailableQuantity(item),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch received item" },
      { status: 500 }
    );
  }
}
