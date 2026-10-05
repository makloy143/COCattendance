import { prisma } from "@/lib/db";
import type { InkColor, ItemCategory, ItemType } from "@/lib/inventory";
import type { InventoryCatalogItemFormValues } from "@/lib/validations";
import type { Prisma } from "@/generated/prisma/client";

export type CatalogItemPayload = {
  itemName: string;
  itemType: ItemType;
  category: ItemCategory;
  inkColor: InkColor | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  notes: string | null;
};

export function toCatalogItemData(
  data: InventoryCatalogItemFormValues
): CatalogItemPayload {
  const category = data.category;
  const itemType =
    category === "INK" || category === "ID_SUPPLIES"
      ? "CONSUMABLE"
      : data.itemType;

  return {
    itemName: data.itemName.trim(),
    itemType,
    category,
    inkColor: category === "INK" && data.inkColor ? data.inkColor : null,
    brand: data.brand?.trim() || null,
    model: data.model?.trim() || null,
    color: data.color?.trim() || null,
    notes: data.notes?.trim() || null,
  };
}

export function catalogDuplicateWhere(
  data: CatalogItemPayload,
  excludeId?: string
): Prisma.InventoryCatalogItemWhereInput {
  return {
    ...(excludeId ? { id: { not: excludeId } } : {}),
    itemName: { equals: data.itemName, mode: "insensitive" },
    category: data.category,
    itemType: data.itemType,
    inkColor: data.inkColor,
    brand: data.brand
      ? { equals: data.brand, mode: "insensitive" }
      : null,
    model: data.model
      ? { equals: data.model, mode: "insensitive" }
      : null,
  };
}

export async function findDuplicateCatalogItem(
  data: CatalogItemPayload,
  excludeId?: string
) {
  return prisma.inventoryCatalogItem.findFirst({
    where: catalogDuplicateWhere(data, excludeId),
  });
}
