import { NextRequest, NextResponse } from "next/server";
import { parseISO, startOfDay } from "date-fns";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import { returnBorrowSchema } from "@/lib/validations";
import { getCurrentTimeString } from "@/lib/inventory";

type RouteContext = { params: Promise<{ id: string }> };

function parseDateOnly(value: string): Date {
  return startOfDay(parseISO(value));
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireInventorySession();
    const { id } = await context.params;

    const existing = await prisma.borrowRecord.findUnique({
      where: { id },
      include: { receivedItem: { select: { itemType: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Borrow record not found" }, { status: 404 });
    }

    if (existing.status === "RETURNED") {
      return NextResponse.json(
        { error: "This item has already been returned" },
        { status: 400 }
      );
    }

    if (existing.receivedItem.itemType !== "EQUIPMENT") {
      return NextResponse.json(
        { error: "Only equipment items can be returned" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = returnBorrowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const dateReturned = parseDateOnly(parsed.data.dateReturned);
    if (dateReturned < startOfDay(existing.dateBorrowed)) {
      return NextResponse.json(
        { error: "Return date cannot be before borrow date" },
        { status: 400 }
      );
    }

    const borrow = await prisma.borrowRecord.update({
      where: { id },
      data: {
        dateReturned,
        timeReturned: parsed.data.timeReturned?.trim() || getCurrentTimeString(),
        returnerName: parsed.data.returnerName.trim(),
        receivedByName: parsed.data.receivedByName.trim(),
        status: "RETURNED",
      },
      include: {
        receivedItem: {
          select: {
            id: true,
            itemName: true,
            itemType: true,
            category: true,
            inkColor: true,
            brand: true,
            model: true,
            color: true,
            serialNumber: true,
          },
        },
      },
    });

    return NextResponse.json(borrow);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to mark item as returned" },
      { status: 500 }
    );
  }
}
