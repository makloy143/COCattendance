import type { BorrowRecord, ReceivedItem } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  aggregateInkStock,
  getAvailableQuantity,
  getInkColorLabel,
  getItemCategoryLabel,
  getReleasedQuantity,
  INK_COLOR_LABELS,
  INK_COLORS,
  INK_MODEL_PRESETS,
  type InkColor,
  type ItemCategory,
} from "@/lib/inventory";

export const LOW_STOCK_THRESHOLDS: Record<ItemCategory, number> = {
  INK: 2,
  ID_SUPPLIES: 5,
  GENERAL: 3,
};

export type StockLevel = "critical" | "low" | "ok";

type ReceivedItemWithBorrows = ReceivedItem & {
  borrows: Pick<BorrowRecord, "quantityBorrowed" | "status">[];
};

export type ConsumableStockSummary = {
  key: string;
  itemName: string;
  category: ItemCategory;
  brand: string | null;
  model: string | null;
  inkColor: InkColor | null;
  totalReceived: number;
  totalReleased: number;
  remaining: number;
  threshold: number;
  stockLevel: StockLevel;
  recommendation: string;
};

export type InkColorNetSummary = {
  inkColor: InkColor;
  label: string;
  totalReceived: number;
  totalReleased: number;
  totalRemaining: number;
  threshold: number;
  stockLevel: StockLevel;
  models: { model: string | null; itemName: string; remaining: number }[];
  recommendation: string | null;
};

export type CategoryStockSummary = {
  category: ItemCategory;
  label: string;
  itemCount: number;
  totalRemaining: number;
  lowStockCount: number;
  criticalCount: number;
};

export type InventoryAnalyticsData = {
  summary: {
    consumableTypes: number;
    needsRestock: number;
    criticalCount: number;
    lowInkColors: number;
    totalReceived: number;
    totalReleased: number;
    netOnHand: number;
  };
  restockRecommendations: ConsumableStockSummary[];
  inkByColor: InkColorNetSummary[];
  byCategory: CategoryStockSummary[];
  allStock: ConsumableStockSummary[];
};

function getStockLevel(remaining: number, threshold: number): StockLevel {
  if (remaining <= 0) return "critical";
  if (remaining <= threshold) return "low";
  return "ok";
}

function formatItemLabel(item: {
  itemName: string;
  brand?: string | null;
  model?: string | null;
  inkColor?: InkColor | null;
}): string {
  const parts = [item.itemName];
  if (item.model) parts.push(item.model);
  if (item.brand) parts.push(`(${item.brand})`);
  if (item.inkColor) parts.push(getInkColorLabel(item.inkColor));
  return parts.join(" · ");
}

function buildRestockRecommendation(
  item: {
    itemName: string;
    category: ItemCategory;
    brand?: string | null;
    model?: string | null;
    inkColor?: InkColor | null;
  },
  remaining: number,
  threshold: number,
  stockLevel: StockLevel
): string {
  const label = formatItemLabel(item);
  const categoryLabel = getItemCategoryLabel(item.category).toLowerCase();

  if (stockLevel === "critical") {
    return `${label} is out of stock. Request or purchase new ${categoryLabel} from COC Main immediately.`;
  }

  const suggested =
    item.category === "INK" && item.inkColor
      ? ` Consider ordering ${INK_MODEL_PRESETS[item.inkColor].slice(0, 2).join(" or ")}.`
      : "";

  return `${label} is running low (${remaining} left, threshold ${threshold}). Request or buy new stock.${suggested}`;
}

function buildInkColorRecommendation(
  inkColor: InkColor,
  totalRemaining: number,
  stockLevel: StockLevel,
  models: { model: string | null; remaining: number }[]
): string | null {
  if (stockLevel === "ok") return null;

  const colorLabel = getInkColorLabel(inkColor);
  const presets = INK_MODEL_PRESETS[inkColor].slice(0, 3).join(", ");

  if (stockLevel === "critical") {
    return `Your ${colorLabel} ink supply is depleted. Request or purchase new ${colorLabel} ink (${presets}).`;
  }

  const lowModels = models
    .filter((m) => m.remaining <= LOW_STOCK_THRESHOLDS.INK)
    .map((m) => m.model ?? "unknown model")
    .join(", ");

  const modelHint = lowModels
    ? ` Low on: ${lowModels}.`
    : ` Consider: ${presets}.`;

  return `Your ${colorLabel} ink supplies are low (${totalRemaining} total remaining).${modelHint} Request or buy new stock from COC Main.`;
}

export function aggregateConsumableStock(
  items: ReceivedItemWithBorrows[]
): ConsumableStockSummary[] {
  const map = new Map<string, ConsumableStockSummary>();

  for (const item of items) {
    const key = `${item.category}|${item.itemName}|${item.brand ?? ""}|${item.model ?? ""}|${item.inkColor ?? ""}`;
    const threshold = LOW_STOCK_THRESHOLDS[item.category];
    const existing = map.get(key) ?? {
      key,
      itemName: item.itemName,
      category: item.category,
      brand: item.brand,
      model: item.model,
      inkColor: item.inkColor,
      totalReceived: 0,
      totalReleased: 0,
      remaining: 0,
      threshold,
      stockLevel: "ok" as StockLevel,
      recommendation: "",
    };

    existing.totalReceived += item.quantity;
    existing.totalReleased += getReleasedQuantity(item.borrows);
    existing.remaining += getAvailableQuantity(item);
    map.set(key, existing);
  }

  return Array.from(map.values())
    .map((entry) => {
      const stockLevel = getStockLevel(entry.remaining, entry.threshold);
      return {
        ...entry,
        stockLevel,
        recommendation: buildRestockRecommendation(
          entry,
          entry.remaining,
          entry.threshold,
          stockLevel
        ),
      };
    })
    .sort((a, b) => {
      const levelOrder = { critical: 0, low: 1, ok: 2 };
      const levelDiff = levelOrder[a.stockLevel] - levelOrder[b.stockLevel];
      if (levelDiff !== 0) return levelDiff;
      return a.remaining - b.remaining;
    });
}

export function aggregateInkByColor(
  inkStock: ReturnType<typeof aggregateInkStock>
): InkColorNetSummary[] {
  const colorMap = new Map<InkColor, InkColorNetSummary>();

  for (const color of INK_COLORS) {
    colorMap.set(color, {
      inkColor: color,
      label: INK_COLOR_LABELS[color],
      totalReceived: 0,
      totalReleased: 0,
      totalRemaining: 0,
      threshold: LOW_STOCK_THRESHOLDS.INK,
      stockLevel: "ok",
      models: [],
      recommendation: null,
    });
  }

  for (const item of inkStock) {
    const color = item.inkColor ?? "OTHER";
    const summary = colorMap.get(color);
    if (!summary) continue;

    summary.totalReceived += item.totalReceived;
    summary.totalReleased += item.totalReleased;
    summary.totalRemaining += item.remaining;
    summary.models.push({
      model: item.model,
      itemName: item.itemName,
      remaining: item.remaining,
    });
  }

  return Array.from(colorMap.values())
    .map((summary) => {
      const stockLevel = getStockLevel(
        summary.totalRemaining,
        summary.threshold
      );
      return {
        ...summary,
        stockLevel,
        recommendation: buildInkColorRecommendation(
          summary.inkColor,
          summary.totalRemaining,
          stockLevel,
          summary.models
        ),
      };
    })
    .sort((a, b) => {
      const levelOrder = { critical: 0, low: 1, ok: 2 };
      const levelDiff = levelOrder[a.stockLevel] - levelOrder[b.stockLevel];
      if (levelDiff !== 0) return levelDiff;
      return a.totalRemaining - b.totalRemaining;
    });
}

export function aggregateByCategory(
  stock: ConsumableStockSummary[]
): CategoryStockSummary[] {
  const categories: ItemCategory[] = ["INK", "ID_SUPPLIES", "GENERAL"];
  return categories.map((category) => {
    const items = stock.filter((s) => s.category === category);
    return {
      category,
      label: getItemCategoryLabel(category),
      itemCount: items.length,
      totalRemaining: items.reduce((sum, i) => sum + i.remaining, 0),
      lowStockCount: items.filter((i) => i.stockLevel === "low").length,
      criticalCount: items.filter((i) => i.stockLevel === "critical").length,
    };
  });
}

export function getRestockRecommendations(
  stock: ConsumableStockSummary[]
): ConsumableStockSummary[] {
  return stock.filter((s) => s.stockLevel !== "ok");
}

export async function getInventoryAnalyticsData(): Promise<InventoryAnalyticsData> {
  const consumableItems = await prisma.receivedItem.findMany({
    where: { itemType: "CONSUMABLE" },
    include: {
      borrows: { select: { quantityBorrowed: true, status: true } },
    },
    orderBy: [{ category: "asc" }, { itemName: "asc" }],
  });

  const allStock = aggregateConsumableStock(consumableItems);
  const restockRecommendations = getRestockRecommendations(allStock);
  const inkItems = consumableItems.filter((i) => i.category === "INK");
  const inkByColor = aggregateInkByColor(aggregateInkStock(inkItems));
  const byCategory = aggregateByCategory(allStock);

  const totalReceived = allStock.reduce((sum, s) => sum + s.totalReceived, 0);
  const totalReleased = allStock.reduce((sum, s) => sum + s.totalReleased, 0);
  const netOnHand = allStock.reduce((sum, s) => sum + s.remaining, 0);

  return {
    summary: {
      consumableTypes: allStock.length,
      needsRestock: restockRecommendations.length,
      criticalCount: restockRecommendations.filter(
        (s) => s.stockLevel === "critical"
      ).length,
      lowInkColors: inkByColor.filter((c) => c.stockLevel !== "ok").length,
      totalReceived,
      totalReleased,
      netOnHand,
    },
    restockRecommendations,
    inkByColor,
    byCategory,
    allStock,
  };
}
