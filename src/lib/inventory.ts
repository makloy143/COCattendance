import { format, parseISO } from "date-fns";
import type {
  AssetStatus as PrismaAssetStatus,
  BorrowRecord,
  ReceivedItem,
} from "@/generated/prisma/client";

export const ITEM_TYPES = ["CONSUMABLE", "EQUIPMENT"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  CONSUMABLE: "Consumable",
  EQUIPMENT: "Equipment",
};

export const ITEM_CATEGORIES = ["GENERAL", "INK", "ID_SUPPLIES"] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  GENERAL: "General",
  INK: "Ink",
  ID_SUPPLIES: "ID Supplies",
};

export const INK_COLORS = ["BLACK", "MAGENTA", "CYAN", "YELLOW", "OTHER"] as const;
export type InkColor = (typeof INK_COLORS)[number];

export const INK_COLOR_LABELS: Record<InkColor, string> = {
  BLACK: "Black (BK)",
  MAGENTA: "Magenta (MG)",
  CYAN: "Cyan (CY)",
  YELLOW: "Yellow (YL)",
  OTHER: "Other",
};

export const INK_COLOR_BADGE_CLASSES: Record<InkColor, string> = {
  BLACK: "bg-neutral-900 text-white border-neutral-700",
  MAGENTA: "bg-pink-600 text-white border-pink-700",
  CYAN: "bg-cyan-500 text-white border-cyan-600",
  YELLOW: "bg-yellow-400 text-neutral-900 border-yellow-500",
  OTHER: "bg-muted text-muted-foreground border-border",
};

export const INK_MODEL_PRESETS: Record<InkColor, string[]> = {
  BLACK: ["BK 664", "BK HP GT52", "BK 003"],
  MAGENTA: ["MG 664", "MG HP GT52", "MG 003"],
  CYAN: ["CY 664", "CY HP GT52", "CY 003"],
  YELLOW: ["YL 664", "YL HP GT52", "YL 003"],
  OTHER: ["MASKING TAPE", "OTHER SUPPLY"],
};

export const DEPARTMENTS = [
  "IT- MAIN SCHOOL",
  "ITSD",
  "MARKETING",
  "FINANCE",
  "REGISTRAR",
  "GUIDANCE",
  "LIBRARY",
  "CLINIC",
  "FACULTY",
  "STUDENT",
  "COMLAB",
  "ITS OFFICE",
] as const;

export const IT_STAFF_NAMES = [
  "CARL JARABELO",
  "CESAR GUINITARAN",
  "CARL PATRICK JARABELO",
  "SIR JAY GSD",
  "MARK LOUIE CARNAJE",
] as const;

export const BORROW_STATUSES = ["ACTIVE", "RETURNED"] as const;
export type BorrowStatus = (typeof BORROW_STATUSES)[number];

export const ASSET_STATUSES = [
  "AVAILABLE",
  "UNDER_MAINTENANCE",
  "RETIRED",
  "LOST",
  "DAMAGED",
] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE: "Available",
  UNDER_MAINTENANCE: "Under Maintenance",
  RETIRED: "Retired",
  LOST: "Lost",
  DAMAGED: "Damaged",
};

export const UNAVAILABLE_ASSET_STATUSES: AssetStatus[] = [
  "UNDER_MAINTENANCE",
  "RETIRED",
  "LOST",
  "DAMAGED",
];

export const ID_ERROR_STATUSES = ["REPRINT", "RESOLVED", "CANCELLED"] as const;
export type IdErrorStatus = (typeof ID_ERROR_STATUSES)[number];

export const ID_ERROR_STATUS_LABELS: Record<IdErrorStatus, string> = {
  REPRINT: "Reprint",
  RESOLVED: "Resolved",
  CANCELLED: "Cancelled",
};

export const ID_ERROR_REASON_PRESETS = [
  "INK NOT GOOD",
  "BAD PRINTING INK",
  "WRONG SPELLING",
  "WRONG INFORMATION",
  "INPUT WRONG COURSE",
  "CHANGING COURSE",
  "WRONG PRINT USER",
  "WRONG WEARING OF UNIFORM",
] as const;

export function getItemTypeLabel(itemType: ItemType): string {
  return ITEM_TYPE_LABELS[itemType];
}

export function getItemCategoryLabel(category: ItemCategory): string {
  return ITEM_CATEGORY_LABELS[category];
}

export function getInkColorLabel(inkColor: InkColor): string {
  return INK_COLOR_LABELS[inkColor];
}

type ReceivedItemWithBorrows = ReceivedItem & {
  borrows: Pick<BorrowRecord, "quantityBorrowed" | "status">[];
  assetStatus?: PrismaAssetStatus | AssetStatus | null;
};

export function getBorrowedQuantity(
  borrows: Pick<BorrowRecord, "quantityBorrowed" | "status">[]
): number {
  return borrows
    .filter((b) => b.status === "ACTIVE")
    .reduce((sum, b) => sum + b.quantityBorrowed, 0);
}

export function getReleasedQuantity(
  borrows: Pick<BorrowRecord, "quantityBorrowed" | "status">[]
): number {
  return borrows.reduce((sum, b) => sum + b.quantityBorrowed, 0);
}

export function getAvailableQuantity(item: ReceivedItemWithBorrows): number {
  if (
    item.assetStatus &&
    UNAVAILABLE_ASSET_STATUSES.includes(item.assetStatus as AssetStatus)
  ) {
    return 0;
  }
  return Math.max(0, item.quantity - getBorrowedQuantity(item.borrows));
}

export function getDisplayAssetStatus(item: {
  assetStatus?: AssetStatus | PrismaAssetStatus | null;
  itemType?: ItemType;
  quantity?: number;
  availableQuantity?: number;
  borrows?: Pick<BorrowRecord, "quantityBorrowed" | "status">[];
}): { key: AssetStatus | "BORROWED"; label: string } {
  if (
    item.assetStatus &&
    item.assetStatus !== "AVAILABLE" &&
    UNAVAILABLE_ASSET_STATUSES.includes(item.assetStatus as AssetStatus)
  ) {
    const key = item.assetStatus as AssetStatus;
    return { key, label: ASSET_STATUS_LABELS[key] };
  }

  const borrowedQty = item.borrows
    ? getBorrowedQuantity(item.borrows)
    : 0;
  if (item.itemType === "EQUIPMENT" && borrowedQty > 0) {
    return { key: "BORROWED", label: "Borrowed" };
  }
  if (
    typeof item.quantity === "number" &&
    borrowedQty >= item.quantity &&
    borrowedQty > 0
  ) {
    return { key: "BORROWED", label: "Borrowed" };
  }

  return { key: "AVAILABLE", label: ASSET_STATUS_LABELS.AVAILABLE };
}

export function formatItemDescription(item: {
  itemName: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  serialNumber?: string | null;
}): string {
  const parts = [item.itemName];
  if (item.brand) parts.push(item.brand);
  if (item.model) parts.push(item.model);
  if (item.color) parts.push(item.color);
  if (item.serialNumber) parts.push(`SN: ${item.serialNumber}`);
  return parts.join(" · ");
}

export function formatDateTime(date: string | Date, time?: string | null): string {
  const dateStr =
    typeof date === "string" ? format(parseISO(date.split("T")[0] ?? date), "MMM d, yyyy") : format(date, "MMM d, yyyy");
  if (time) return `${dateStr} at ${time}`;
  return dateStr;
}

export function getCurrentTimeString(): string {
  return format(new Date(), "HH:mm");
}

export type InkStockSummary = {
  key: string;
  itemName: string;
  inkColor: InkColor | null;
  model: string | null;
  totalReceived: number;
  totalReleased: number;
  remaining: number;
};

export function aggregateInkStock(
  items: (ReceivedItem & {
    borrows: Pick<BorrowRecord, "quantityBorrowed" | "status">[];
  })[]
): InkStockSummary[] {
  const map = new Map<string, InkStockSummary>();

  for (const item of items) {
    const key = `${item.itemName}|${item.model ?? ""}|${item.inkColor ?? ""}`;
    const existing = map.get(key) ?? {
      key,
      itemName: item.itemName,
      inkColor: item.inkColor,
      model: item.model,
      totalReceived: 0,
      totalReleased: 0,
      remaining: 0,
    };
    existing.totalReceived += item.quantity;
    existing.totalReleased += getReleasedQuantity(item.borrows);
    existing.remaining += getAvailableQuantity(item);
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.itemName.localeCompare(b.itemName)
  );
}
