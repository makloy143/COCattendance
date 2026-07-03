import { NextRequest, NextResponse } from "next/server";
import { parseISO, startOfDay } from "date-fns";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import { getAvailableQuantity, getCurrentTimeString } from "@/lib/inventory";
import { borrowRecordSchema } from "@/lib/validations";

function parseDateOnly(value: string): Date {
  return startOfDay(parseISO(value));
}

export async function GET(request: NextRequest) {
  try {
    await requireInventorySession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status")?.trim().toUpperCase();
    const itemType = searchParams.get("itemType")?.trim().toUpperCase();
    const equipmentOnly = searchParams.get("equipmentOnly") === "true";

    const borrows = await prisma.borrowRecord.findMany({
      where: {
        ...(status === "ACTIVE" || status === "RETURNED"
          ? { status: status as "ACTIVE" | "RETURNED" }
          : {}),
        ...(itemType === "CONSUMABLE" || itemType === "EQUIPMENT"
          ? { receivedItem: { itemType: itemType as "CONSUMABLE" | "EQUIPMENT" } }
          : {}),
        ...(equipmentOnly
          ? { receivedItem: { itemType: "EQUIPMENT" } }
          : {}),
        ...(search
          ? {
              OR: [
                { borrowerName: { contains: search } },
                { department: { contains: search } },
                { returnerName: { contains: search } },
                { receivedByName: { contains: search } },
                { notes: { contains: search } },
                {
                  receivedItem: {
                    OR: [
                      { itemName: { contains: search } },
                      { brand: { contains: search } },
                      { model: { contains: search } },
                      { serialNumber: { contains: search } },
                    ],
                  },
                },
              ],
            }
          : {}),
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
      orderBy: [{ dateBorrowed: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(borrows);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch borrow records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireInventorySession();

    const body = await request.json();
    const parsed = borrowRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const item = await prisma.receivedItem.findUnique({
      where: { id: data.receivedItemId },
      include: {
        borrows: {
          select: { quantityBorrowed: true, status: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.itemType === "EQUIPMENT" && !data.signatureConfirmed) {
      return NextResponse.json(
        { error: "Signature confirmation is required for equipment borrows" },
        { status: 400 }
      );
    }

    const availableQuantity = getAvailableQuantity(item);

    if (item.itemType === "EQUIPMENT") {
      if (data.quantityBorrowed !== 1) {
        return NextResponse.json(
          { error: "Equipment can only be borrowed one unit at a time" },
          { status: 400 }
        );
      }
      if (availableQuantity < 1) {
        return NextResponse.json(
          { error: "This equipment is already borrowed" },
          { status: 400 }
        );
      }
    } else if (data.quantityBorrowed > availableQuantity) {
      return NextResponse.json(
        {
          error: `Only ${availableQuantity} unit${availableQuantity === 1 ? "" : "s"} available to release`,
        },
        { status: 400 }
      );
    }

    const borrow = await prisma.borrowRecord.create({
      data: {
        receivedItemId: data.receivedItemId,
        borrowerName: data.borrowerName.trim(),
        department: data.department.trim(),
        quantityBorrowed: data.quantityBorrowed,
        dateBorrowed: parseDateOnly(data.dateBorrowed),
        timeBorrowed: data.timeBorrowed?.trim() || getCurrentTimeString(),
        dueDate: data.dueDate ? parseDateOnly(data.dueDate) : null,
        signatureConfirmed: data.signatureConfirmed ?? false,
        notes: data.notes?.trim() || null,
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

    return NextResponse.json(borrow, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create borrow record" },
      { status: 500 }
    );
  }
}
