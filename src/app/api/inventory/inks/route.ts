import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import { aggregateInkStock } from "@/lib/inventory";

export async function GET(request: NextRequest) {
  try {
    await requireInventorySession();

    const { searchParams } = new URL(request.url);
    const ledger = searchParams.get("ledger") === "true";

    const inkItems = await prisma.receivedItem.findMany({
      where: { category: "INK" },
      include: {
        borrows: {
          select: {
            id: true,
            quantityBorrowed: true,
            status: true,
            borrowerName: true,
            department: true,
            dateBorrowed: true,
            timeBorrowed: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ dateReceived: "desc" }, { createdAt: "desc" }],
    });

    const stock = aggregateInkStock(inkItems);

    if (!ledger) {
      return NextResponse.json({ stock, items: inkItems });
    }

    type LedgerEntry = {
      id: string;
      type: "RECEIVE" | "RELEASE";
      itemName: string;
      inkColor: string | null;
      model: string | null;
      quantity: number;
      date: string;
      time: string | null;
      personName: string;
      department: string;
    };

    const entries: LedgerEntry[] = [];

    for (const item of inkItems) {
      entries.push({
        id: `recv-${item.id}`,
        type: "RECEIVE",
        itemName: item.itemName,
        inkColor: item.inkColor,
        model: item.model,
        quantity: item.quantity,
        date: item.dateReceived.toISOString(),
        time: null,
        personName: item.senderName,
        department: item.receivedByDepartment,
      });

      for (const borrow of item.borrows) {
        entries.push({
          id: `rel-${borrow.id}`,
          type: "RELEASE",
          itemName: item.itemName,
          inkColor: item.inkColor,
          model: item.model,
          quantity: borrow.quantityBorrowed,
          date: borrow.dateBorrowed.toISOString(),
          time: borrow.timeBorrowed,
          personName: borrow.borrowerName,
          department: borrow.department,
        });
      }
    }

    entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ stock, ledger: entries });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch ink data" },
      { status: 500 }
    );
  }
}
