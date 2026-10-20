import { APP_TIMEZONE, formatManilaDateInput, getManilaDayStart } from "@/lib/date-utils";

export const ID_STOCK_ITEM_TYPES = [
  "ID_CARD",
  "ID_CARD_BOX",
  "SLING_STUDENT",
  "SLING_EMPLOYEE",
  "SLING_BUNDLE",
  "XID_COLOR",
  "XID_RETRANSFER_FILM",
  "SUPPLY",
] as const;
export type IdStockItemType = (typeof ID_STOCK_ITEM_TYPES)[number];

export const ID_RECEIPT_ITEM_TYPES = [
  "ID_CARD",
  "SLING_STUDENT",
  "SLING_EMPLOYEE",
  "XID_COLOR",
  "XID_RETRANSFER_FILM",
] as const;
export type IdReceiptItemType = (typeof ID_RECEIPT_ITEM_TYPES)[number];

export const ID_STOCK_ITEM_LABELS: Record<IdStockItemType, string> = {
  ID_CARD: "PLAIN WHITE PVC CARD",
  ID_CARD_BOX: "PLAIN WHITE PVC CARD",
  SLING_STUDENT: "Sling for Student",
  SLING_EMPLOYEE: "Sling for Employee",
  SLING_BUNDLE: "Sling for Student",
  XID_COLOR: "XID PRINTER (COLOR) Y,M,C,K",
  XID_RETRANSFER_FILM: "XID PRINTER RETRANSFER FILM",
  SUPPLY: "Box",
};

export const ID_STOCK_CATEGORIES = [
  "ID_CARD",
  "SLING_STUDENT",
  "SLING_EMPLOYEE",
  "SUPPLY",
] as const;
export type IdStockCategory = (typeof ID_STOCK_CATEGORIES)[number];

export const ID_STOCK_CATEGORY_LABELS: Record<IdStockCategory, string> = {
  ID_CARD: "ID card (box or piece)",
  SLING_STUDENT: "Sling for student (bundle or piece)",
  SLING_EMPLOYEE: "Sling for employee (bundle or piece)",
  SUPPLY: "Box",
};

export type IdItemTypeOption = {
  id: string;
  name: string;
  category: IdStockCategory;
};

export const ID_RECEIPT_UNITS = ["BOX", "PIECE"] as const;
export type IdReceiptUnit = (typeof ID_RECEIPT_UNITS)[number];

export const ID_RECEIPT_UNIT_LABELS: Record<IdReceiptUnit, string> = {
  BOX: "Box",
  PIECE: "Piece",
};

export function receiptUnitLabel(category: IdStockCategory, unit: IdReceiptUnit) {
  if (category === "SLING_STUDENT" || category === "SLING_EMPLOYEE") {
    return unit === "PIECE" ? "Piece" : "Bundle";
  }
  return unit === "PIECE" ? "Piece" : "Box";
}

export const ID_SLING_KINDS = ["STUDENT", "EMPLOYEE"] as const;
export type IdSlingKind = (typeof ID_SLING_KINDS)[number];

export const ID_SLING_KIND_LABELS: Record<IdSlingKind, string> = {
  STUDENT: "Student",
  EMPLOYEE: "Employee",
};

export function isIdCardItem(itemType: IdStockItemType) {
  return itemType === "ID_CARD" || itemType === "ID_CARD_BOX";
}

export function isSlingItem(itemType: IdStockItemType) {
  return (
    itemType === "SLING_STUDENT" ||
    itemType === "SLING_EMPLOYEE" ||
    itemType === "SLING_BUNDLE"
  );
}

export function isPrinterSupplyItem(itemType: IdStockItemType) {
  return (
    itemType === "XID_COLOR" ||
    itemType === "XID_RETRANSFER_FILM" ||
    itemType === "SUPPLY"
  );
}

export function categoryForItemType(itemType: IdStockItemType): IdStockCategory {
  if (isIdCardItem(itemType)) return "ID_CARD";
  if (itemType === "SLING_EMPLOYEE") return "SLING_EMPLOYEE";
  if (isSlingItem(itemType)) return "SLING_STUDENT";
  return "SUPPLY";
}

export function itemTypeForCategory(category: IdStockCategory): IdStockItemType {
  if (category === "ID_CARD") return "ID_CARD";
  if (category === "SLING_STUDENT") return "SLING_STUDENT";
  if (category === "SLING_EMPLOYEE") return "SLING_EMPLOYEE";
  return "SUPPLY";
}

export function slingKindForItem(itemType: IdStockItemType): IdSlingKind | null {
  if (itemType === "SLING_EMPLOYEE") return "EMPLOYEE";
  if (isSlingItem(itemType)) return "STUDENT";
  return null;
}

export function normalizeDescriptionCode(value: string) {
  return value.trim().replace(/^#+/, "");
}

export function formatDescriptionCode(value: string | null | undefined) {
  const code = value?.trim().replace(/^#+/, "") ?? "";
  return code ? `#${code}` : "";
}

export function formatStockItemTitle(name: string, descriptionCode?: string | null) {
  const label = name.trim();
  const mark = formatDescriptionCode(descriptionCode);
  return mark ? `${label} ${mark}` : label;
}

export function receiptItemTitle(receipt: {
  itemType: IdStockItemType;
  descriptionCode?: string | null;
  itemOption?: { name: string } | null;
}) {
  return formatStockItemTitle(
    receipt.itemOption?.name || ID_STOCK_ITEM_LABELS[receipt.itemType],
    receipt.descriptionCode
  );
}

export const ID_RELEASE_STATUSES = ["NEW_ID", "REPRINT", "SLING"] as const;
export type IdReleaseStatus = (typeof ID_RELEASE_STATUSES)[number];

export const ID_CARD_RELEASE_STATUSES = ["NEW_ID", "REPRINT"] as const;

export const ID_RELEASE_STATUS_LABELS: Record<IdReleaseStatus, string> = {
  NEW_ID: "NEW ID",
  REPRINT: "REPRINT",
  SLING: "Sling",
};

export const ID_BAD_PRINT_STATUSES = ["REPRINT", "RESOLVED", "CANCELLED"] as const;
export type IdBadPrintStatus = (typeof ID_BAD_PRINT_STATUSES)[number];

export const ID_BAD_PRINT_STATUS_LABELS: Record<IdBadPrintStatus, string> = {
  REPRINT: "REPRINT",
  RESOLVED: "RESOLVED",
  CANCELLED: "CANCELLED",
};

export const ID_WITHDRAWAL_REASON_PRESETS = [
  "TRANSFERRED",
  "FINANCIAL",
  "PERSONAL",
  "FAMILY REASON",
  "HEALTH",
  "STOPPED SCHOOLING",
] as const;

export const ID_RELEASE_REASON_PRESETS = [
  "NEW ENROLLMENT",
  "REPLACEMENT",
  "BAD PRINTING",
  "LOST ID",
] as const;

export const ID_BAD_PRINT_REASON_PRESETS = [
  "INK NOT GOOD",
  "BAD PRINTING INK",
  "WRONG SPELLING",
  "WRONG INFORMATION",
  "INPUT WRONG COURSE",
  "CHANGING COURSE",
  "WRONG PRINT USER",
  "WRONG WEARING OF UNIFORM",
] as const;

export const ID_PERIODS = ["month", "year", "all"] as const;
export type IdPeriod = (typeof ID_PERIODS)[number];

export const ID_PERIOD_LABELS: Record<IdPeriod, string> = {
  month: "This Month",
  year: "This Year",
  all: "All Time",
};

export const INVENTORY_DASHBOARDS = [
  {
    id: "general",
    label: "General Inventory",
    href: "/inventory",
    available: true,
    description: "Received items, equipment borrows, and releases",
  },
  {
    id: "id",
    label: "ID Maintenance",
    href: "/inventory/id",
    available: true,
    description: "ID card boxes, slings, bad printing, and ID releases",
  },
  {
    id: "ink",
    label: "Ink",
    href: "/inventory/inks",
    available: true,
    description: "Ink bottles received, released, and remaining by model",
  },
] as const;

export type InventoryDashboardId = (typeof INVENTORY_DASHBOARDS)[number]["id"];

export class IdStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdStockError";
  }
}

export function parseIdPeriod(value: string | undefined | null): IdPeriod {
  if (value === "year" || value === "all" || value === "month") return value;
  return "month";
}

export function inventoryDashboardIdFromPath(pathname: string): InventoryDashboardId {
  if (pathname === "/inventory/id" || pathname.startsWith("/inventory/id/")) {
    return "id";
  }
  if (pathname === "/inventory/inks" || pathname.startsWith("/inventory/inks/")) {
    return "ink";
  }
  return "general";
}

export function isIdMaintenancePath(pathname: string) {
  return inventoryDashboardIdFromPath(pathname) === "id";
}

export function isInkMaintenancePath(pathname: string) {
  return pathname === "/inventory/inks" || pathname.startsWith("/inventory/inks/");
}

export function getIdPeriodRange(
  period: IdPeriod,
  now = new Date()
): { start: Date; end: Date } | null {
  if (period === "all") return null;

  const key = formatManilaDateInput(now);
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));

  if (period === "year") {
    return {
      start: getManilaDayStart(`${year}-01-01`),
      end: getManilaDayEndOfYear(year),
    };
  }

  const startKey = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextKey = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return {
    start: getManilaDayStart(startKey),
    end: new Date(getManilaDayStart(nextKey).getTime() - 1),
  };
}

function getManilaDayEndOfYear(year: number) {
  return new Date(getManilaDayStart(`${year + 1}-01-01`).getTime() - 1);
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatIdDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function calculateIdStock(input: {
  cardsReceived: number;
  cardsReleased: number;
  cardsWasted: number;
  slingsReceived: number;
  slingsUsed: number;
}) {
  return {
    cardsRemaining: input.cardsReceived - input.cardsReleased - input.cardsWasted,
    slingsRemaining: input.slingsReceived - input.slingsUsed,
  };
}

export function wastesCardStock(status: IdBadPrintStatus) {
  return status !== "CANCELLED";
}

type PackRow = {
  packsReceived: number;
  unitsPerPack: number;
  unitsAdded: number;
  unit?: IdReceiptUnit;
};

export function buildCardPackNote(
  rows: PackRow[],
  cardsPerBox: number,
  cardName = "PLAIN WHITE PVC CARD"
) {
  const boxes = rows.filter((row) => row.unit !== "PIECE");
  const pieces = rows.filter((row) => row.unit === "PIECE");
  const boxPacks = boxes.reduce((sum, row) => sum + row.packsReceived, 0);
  const boxUnits = boxes.reduce((sum, row) => sum + row.unitsAdded, 0);
  const pieceUnits = pieces.reduce((sum, row) => sum + row.unitsAdded, 0);

  if (boxPacks === 0 && pieceUnits === 0) {
    return `${cardName}. Each box contains ${formatCount(cardsPerBox)} cards. A piece adds 1 card.`;
  }

  const parts: string[] = [];
  if (boxPacks > 0) {
    const rates = new Set(boxes.map((row) => row.unitsPerPack));
    if (rates.size === 1) {
      const rate = boxes[0]?.unitsPerPack ?? cardsPerBox;
      parts.push(
        `${formatCount(boxPacks)} boxes × ${formatCount(rate)} cards = ${formatCount(boxUnits)} cards`
      );
    } else {
      parts.push(`${formatCount(boxUnits)} cards from boxes`);
    }
  }
  if (pieceUnits > 0) {
    parts.push(`${formatCount(pieceUnits)} individual pieces`);
  }
  return parts.join(" · ");
}

export function buildSlingPackNote(rows: PackRow[], slingsPerBundle: number) {
  const bundles = rows.filter((row) => row.unit !== "PIECE");
  const pieces = rows.filter((row) => row.unit === "PIECE");
  const bundlePacks = bundles.reduce((sum, row) => sum + row.packsReceived, 0);
  const bundleUnits = bundles.reduce((sum, row) => sum + row.unitsAdded, 0);
  const pieceUnits = pieces.reduce((sum, row) => sum + row.unitsAdded, 0);

  if (bundlePacks === 0 && pieceUnits === 0) {
    return `Each bundle contains ${formatCount(slingsPerBundle)} slings. A piece adds 1 sling.`;
  }

  const parts: string[] = [];
  if (bundlePacks > 0) {
    const rates = new Set(bundles.map((row) => row.unitsPerPack));
    if (rates.size === 1) {
      const rate = bundles[0]?.unitsPerPack ?? slingsPerBundle;
      parts.push(
        `${formatCount(bundlePacks)} bundles × ${formatCount(rate)} slings = ${formatCount(bundleUnits)} slings`
      );
    } else {
      parts.push(`${formatCount(bundleUnits)} slings from bundles`);
    }
  }
  if (pieceUnits > 0) {
    parts.push(`${formatCount(pieceUnits)} individual pieces`);
  }
  return parts.join(" · ");
}

export type IdCardBoxRow = {
  id: string;
  name: string;
  pieces: number;
  used: number;
  remaining: number;
  startedAt: string | null;
  endedAt: string | null;
};

type CardBoxSource = {
  id: string;
  name: string;
  unit: IdReceiptUnit;
  unitsPerPack: number;
  unitsAdded: number;
  openingRemaining?: number | null;
  balanceRecordedAt?: Date | null;
  receivedAt: Date;
  createdAt: Date;
};

type CardUseSource = {
  at: Date;
  quantity: number;
  createdAt: Date;
  boxId?: string | null;
};

function takeFromSlot(
  slot: {
    pieces: number;
    used: number;
    startedAt: Date | null;
    endedAt: Date | null;
  },
  quantity: number,
  at: Date
) {
  const room = slot.pieces - slot.used;
  const take = Math.min(room, quantity);
  if (take <= 0) return 0;
  if (!slot.startedAt) slot.startedAt = at;
  slot.used += take;
  if (slot.used >= slot.pieces) slot.endedAt = at;
  return take;
}

export function buildCardBoxRows(
  receipts: CardBoxSource[],
  uses: CardUseSource[]
): IdCardBoxRow[] {
  const ordered = [...receipts].sort(
    (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime() || a.createdAt.getTime() - b.createdAt.getTime()
  );
  const slots: Array<{
    id: string;
    name: string;
    pieces: number;
    show: boolean;
    balanceRecordedAt: Date | null;
    used: number;
    startedAt: Date | null;
    endedAt: Date | null;
  }> = [];

  for (const receipt of ordered) {
    if (receipt.openingRemaining != null && receipt.openingRemaining > 0) {
      slots.push({
        id: receipt.id,
        name: receipt.name,
        pieces: receipt.openingRemaining,
        show: true,
        balanceRecordedAt: receipt.balanceRecordedAt ?? null,
        used: 0,
        startedAt: null,
        endedAt: null,
      });
      continue;
    }

    if (receipt.unit === "PIECE" || receipt.unitsAdded <= 0) {
      if (receipt.unitsAdded > 0) {
        slots.push({
          id: receipt.id,
          name: receipt.name,
          pieces: receipt.unitsAdded,
          show: true,
          balanceRecordedAt: null,
          used: 0,
          startedAt: null,
          endedAt: null,
        });
      }
      continue;
    }

    const boxSize = receipt.unitsPerPack > 0 ? receipt.unitsPerPack : receipt.unitsAdded;
    const boxCount = Math.max(1, Math.ceil(receipt.unitsAdded / boxSize));
    let remaining = receipt.unitsAdded;
    for (let index = 0; index < boxCount && remaining > 0; index += 1) {
      const pieces = Math.min(boxSize, remaining);
      remaining -= pieces;
      slots.push({
        id: boxCount === 1 ? receipt.id : `${receipt.id}:${index + 1}`,
        name: boxCount === 1 ? receipt.name : `${receipt.name} · box ${index + 1}`,
        pieces,
        show: true,
        balanceRecordedAt: null,
        used: 0,
        startedAt: null,
        endedAt: null,
      });
    }
  }

  const orderedUses = [...uses]
    .filter((use) => use.quantity > 0)
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.createdAt.getTime() - b.createdAt.getTime());

  const countsAgainst = (
    slot: { balanceRecordedAt: Date | null },
    use: CardUseSource
  ) => !slot.balanceRecordedAt || use.createdAt.getTime() > slot.balanceRecordedAt.getTime();

  for (const use of orderedUses) {
    let left = use.quantity;
    if (use.boxId) {
      const target = slots.find((slot) => slot.id === use.boxId);
      if (target && countsAgainst(target, use)) {
        left -= takeFromSlot(target, left, use.at);
      } else if (target && !target.startedAt) {
        target.startedAt = use.at;
      }
    }
    for (const slot of slots) {
      if (left <= 0) break;
      if (!countsAgainst(slot, use) || slot.used >= slot.pieces) continue;
      left -= takeFromSlot(slot, left, use.at);
    }
  }

  return slots
    .filter((slot) => slot.show)
    .map((slot) => ({
      id: slot.id,
      name: slot.name,
      pieces: slot.pieces,
      used: slot.used,
      remaining: slot.pieces - slot.used,
      startedAt: slot.startedAt ? slot.startedAt.toISOString() : null,
      endedAt: slot.endedAt ? slot.endedAt.toISOString() : null,
    }));
}

export function pvcCardOptionLabel(box: IdCardBoxRow) {
  const status = box.endedAt
    ? `ended ${formatIdDate(box.endedAt)}`
    : box.startedAt
      ? `started ${formatIdDate(box.startedAt)}`
      : "not started";
  return `${box.name} · ${box.pieces} pcs · ${status} · ${box.remaining} left`;
}

export function currentPvcBoxId(boxes: IdCardBoxRow[], latestUsedBoxId?: string | null) {
  const open = boxes.filter((box) => box.remaining > 0 && !box.endedAt);
  if (latestUsedBoxId && open.some((box) => box.id === latestUsedBoxId)) {
    return latestUsedBoxId;
  }
  return [...open].reverse()[0]?.id ?? null;
}

export type IdStockView = {
  cardsPerBox: number;
  cardBoxes: IdCardBoxRow[];
  currentCardBoxId: string | null;
  slingsPerBundle: number;
  lowIdCardThreshold: number;
  lowSlingThreshold: number;
  cardPacks: number;
  cardsReceived: number;
  cardsReleased: number;
  cardsWasted: number;
  cardsRemaining: number;
  cardPackNote: string;
  slingPacks: number;
  slingsReceived: number;
  slingsUsed: number;
  slingsRemaining: number;
  slingPackNote: string;
  studentSlingsReceived: number;
  studentSlingsUsed: number;
  studentSlingsRemaining: number;
  employeeSlingsReceived: number;
  employeeSlingsUsed: number;
  employeeSlingsRemaining: number;
  cardItemName: string;
  supplyBoxes: { id: string; name: string; boxes: number }[];
  lowCards: boolean;
  lowSlings: boolean;
};

export type IdPeriodActivity = {
  cardsReleased: number;
  slingsUsed: number;
  releaseCount: number;
  cardsWasted: number;
  badPrintCount: number;
};

export type IdBadPrintRow = {
  id: string;
  personName: string;
  course: string;
  idNumber: string;
  dateLabel: string;
  status: IdBadPrintStatus;
  reason: string;
  quantity: number;
};

export type IdReleaseRow = {
  id: string;
  personName: string;
  course: string;
  idNumber: string;
  dateLabel: string;
  status: IdReleaseStatus;
  reason: string;
  printedBy: string;
  idCardsUsed: number;
  slingsUsed: number;
  slingKind: IdSlingKind | null;
  pvcCardName: string | null;
  pvcCardEnded: boolean;
};

export type IdSurrenderRow = {
  id: string;
  personName: string;
  course: string;
  yearLevel: string | null;
  idNumber: string;
  dateLabel: string;
  reason: string;
  idCardsReturned: number;
  slingsReturned: number;
  receivedBy: string;
};

export type IdHistoryKind = "RECEIPT" | "RELEASE" | "BAD_PRINT" | "SURRENDER";

export type IdHistoryEvent = {
  id: string;
  dateLabel: string;
  kind: IdHistoryKind;
  title: string;
  detail: string;
  cards: number;
  slings: number;
};
