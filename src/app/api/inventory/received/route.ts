import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import { getAvailableQuantity } from "@/lib/inventory";
import { receivedItemSchema } from "@/lib/validations";
import { parseISO, startOfDay } from "date-fns";
import type { ItemCategory, ItemType } from "@/lib/inventory";

function parseDateOnly(value: string): Date {
  return startOfDay(parseISO(value));
}

function serializeReceivedItem(
  item: Awaited<ReturnType<typeof fetchReceivedItems>>[number]
) {
  const availableQuantity = getAvailableQuantity(item);
  return {
    ...item,
    availableQuantity,
  };
}

async function fetchReceivedItems(options: {
  search?: string;
  category?: ItemCategory;
  itemType?: ItemType;
}) {
  const { search, category, itemType } = options;

  return prisma.receivedItem.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(itemType ? { itemType } : {}),
      ...(search
        ? {
            OR: [
              { itemName: { contains: search } },
              { brand: { contains: search } },
              { model: { contains: search } },
              { color: { contains: search } },
              { serialNumber: { contains: search } },
              { senderName: { contains: search } },
              { senderSource: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      borrows: {
        select: { quantityBorrowed: true, status: true },
      },
    },
    orderBy: [{ dateReceived: "desc" }, { createdAt: "desc" }],
  });
}

export async function GET(request: NextRequest) {
  try {
    await requireInventorySession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const availableOnly = searchParams.get("availableOnly") === "true";
    const category = searchParams.get("category")?.trim().toUpperCase() as
      | ItemCategory
      | undefined;
    const itemType = searchParams.get("itemType")?.trim().toUpperCase() as
      | ItemType
      | undefined;

    const items = await fetchReceivedItems({ search, category, itemType });
    const serialized = items.map(serializeReceivedItem);

    if (availableOnly) {
      return NextResponse.json(
        serialized.filter((item) => item.availableQuantity > 0)
      );
    }

    return NextResponse.json(serialized);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch received items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireInventorySession();

    const body = await request.json();
    const parsed = receivedItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const item = await prisma.receivedItem.create({
      data: {
        itemName: data.itemName.trim(),
        itemType: data.itemType,
        category: data.category,
        inkColor: data.inkColor || null,
        brand: data.brand?.trim() || null,
        model: data.model?.trim() || null,
        color: data.color?.trim() || null,
        serialNumber: data.serialNumber?.trim() || null,
        quantity: data.quantity,
        senderName: data.senderName.trim(),
        senderSource: data.senderSource.trim(),
        receivedByDepartment: data.receivedByDepartment.trim(),
        dateReceived: parseDateOnly(data.dateReceived),
        notes: data.notes?.trim() || null,
      },
      include: {
        borrows: {
          select: { quantityBorrowed: true, status: true },
        },
      },
    });

    return NextResponse.json(serializeReceivedItem(item), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create received item" },
      { status: 500 }
    );
  }
}
