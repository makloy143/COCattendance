import { NextRequest, NextResponse } from "next/server";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import {
  inventoryCatalogItemSchema,
  inventoryCatalogItemUpdateSchema,
} from "@/lib/validations";
import {
  findDuplicateCatalogItem,
  toCatalogItemData,
} from "@/lib/inventory-catalog";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireInventorySession();
    const { id } = await context.params;

    const item = await prisma.inventoryCatalogItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch catalog item" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireInventorySession();
    const { id } = await context.params;

    const existing = await prisma.inventoryCatalogItem.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = inventoryCatalogItemUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const merged = {
      itemName: parsed.data.itemName ?? existing.itemName,
      itemType: parsed.data.itemType ?? existing.itemType,
      category: parsed.data.category ?? existing.category,
      inkColor: parsed.data.inkColor ?? existing.inkColor ?? "",
      brand: parsed.data.brand ?? existing.brand ?? "",
      model: parsed.data.model ?? existing.model ?? "",
      color: parsed.data.color ?? existing.color ?? "",
      notes: parsed.data.notes ?? existing.notes ?? "",
    };

    const fullParsed = inventoryCatalogItemSchema.safeParse(merged);
    if (!fullParsed.success) {
      return NextResponse.json(
        { error: fullParsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = toCatalogItemData(fullParsed.data);
    const duplicate = await findDuplicateCatalogItem(data, id);
    if (duplicate) {
      return NextResponse.json(
        { error: "This item already exists in the catalog" },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryCatalogItem.update({
      where: { id },
      data: {
        ...data,
        ...(typeof parsed.data.isActive === "boolean"
          ? { isActive: parsed.data.isActive }
          : {}),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update catalog item" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireInventorySession();
    const { id } = await context.params;

    const existing = await prisma.inventoryCatalogItem.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.inventoryCatalogItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete catalog item" },
      { status: 500 }
    );
  }
}
