import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import { inventoryCatalogItemSchema } from "@/lib/validations";
import {
  findDuplicateCatalogItem,
  toCatalogItemData,
} from "@/lib/inventory-catalog";
import type { ItemCategory, ItemType } from "@/lib/inventory";

export async function GET(request: NextRequest) {
  try {
    await requireInventorySession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const includeInactive = searchParams.get("all") === "true";
    const category = searchParams.get("category")?.trim().toUpperCase() as
      | ItemCategory
      | undefined;
    const itemType = searchParams.get("itemType")?.trim().toUpperCase() as
      | ItemType
      | undefined;

    const items = await prisma.inventoryCatalogItem.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(category ? { category } : {}),
        ...(itemType ? { itemType } : {}),
        ...(search
          ? {
              OR: [
                { itemName: { contains: search, mode: "insensitive" } },
                { brand: { contains: search, mode: "insensitive" } },
                { model: { contains: search, mode: "insensitive" } },
                { color: { contains: search, mode: "insensitive" } },
                { notes: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ category: "asc" }, { itemName: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch catalog items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireInventorySession();

    const body = await request.json();
    const parsed = inventoryCatalogItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = toCatalogItemData(parsed.data);
    const duplicate = await findDuplicateCatalogItem(data);
    if (duplicate) {
      return NextResponse.json(
        { error: "This item already exists in the catalog" },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryCatalogItem.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create catalog item" },
      { status: 500 }
    );
  }
}
