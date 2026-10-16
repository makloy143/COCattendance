import { INK_MODEL_PRESETS, type InkColor } from "@/lib/inventory";

export const INK_LOW_STOCK_AT_MOST = 2;

const COLOR_RANK: Record<InkColor, number> = {
  BLACK: 0,
  MAGENTA: 1,
  CYAN: 2,
  YELLOW: 3,
  OTHER: 4,
};

const MODEL_RANK = ["664", "003", "HP GT52", "HP GTS2"];

export type InkMovement = {
  id: string;
  itemName: string;
  inkColor: InkColor | null;
  quantity: number;
  at: Date;
  person: string;
  department: string;
};

export type InkReceiptSource = {
  id: string;
  itemName: string;
  inkColor: InkColor | null;
  quantity: number;
  dateReceived: Date;
  person: string;
  department: string;
  released: number;
  balance: number;
};

export type InkModelStock = {
  key: string;
  name: string;
  inkColor: InkColor | null;
  received: number;
  released: number;
  balance: number;
};

export type InkRecordRow = {
  id: string;
  model: string;
  inkColor: InkColor | null;
  quantity: number;
  dateLabel: string;
  person: string;
  department: string;
};

export type InkDashboardView = {
  received: number;
  released: number;
  remaining: number;
  lowStockCount: number;
  models: InkModelStock[];
  lowStock: { name: string; balance: number; inkColor: InkColor | null }[];
  receipts: InkRecordRow[];
  releases: InkRecordRow[];
};

function presetModels(): InkModelStock[] {
  return Object.entries(INK_MODEL_PRESETS).flatMap(([color, names]) => {
    if (color === "OTHER") return [];
    return names.map((name) => ({
      key: name,
      name,
      inkColor: color as InkColor,
      received: 0,
      released: 0,
      balance: 0,
    }));
  });
}

function modelSort(name: string, inkColor: InkColor | null) {
  const upper = name.toUpperCase();
  const modelRank = MODEL_RANK.findIndex((token) => upper.includes(token));
  return (modelRank === -1 ? 50 : modelRank) * 10 + (inkColor ? COLOR_RANK[inkColor] : 9);
}

export function formatInkDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function inRange(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function buildInkDashboard(input: {
  receipts: InkReceiptSource[];
  releases: InkMovement[];
  range: { start: Date; end: Date } | null;
}): InkDashboardView {
  const matches = (date: Date) =>
    !input.range || inRange(date, input.range.start, input.range.end);

  const byName = new Map<string, InkModelStock>();
  for (const preset of presetModels()) byName.set(preset.key, { ...preset });

  for (const receipt of input.receipts) {
    const key = receipt.itemName.trim() || "Ink";
    const current = byName.get(key) ?? {
      key,
      name: key,
      inkColor: receipt.inkColor,
      received: 0,
      released: 0,
      balance: 0,
    };
    current.received += receipt.quantity;
    current.released += receipt.released;
    current.balance += receipt.balance;
    if (!current.inkColor && receipt.inkColor) current.inkColor = receipt.inkColor;
    byName.set(key, current);
  }

  const models = [...byName.values()].sort(
    (a, b) => modelSort(a.name, a.inkColor) - modelSort(b.name, b.inkColor) || a.name.localeCompare(b.name)
  );
  const remaining = models.reduce((sum, model) => sum + model.balance, 0);
  const lowStock = models
    .filter((model) => model.received > 0 && model.balance <= INK_LOW_STOCK_AT_MOST)
    .map((model) => ({ name: model.name, balance: model.balance, inkColor: model.inkColor }))
    .sort((a, b) => a.balance - b.balance || a.name.localeCompare(b.name));

  const periodReceipts = input.receipts.filter((row) => matches(row.dateReceived));
  const periodReleases = input.releases.filter((row) => matches(row.at));
  const received = periodReceipts.reduce((sum, row) => sum + row.quantity, 0);
  const released = periodReleases.reduce((sum, row) => sum + row.quantity, 0);

  const toRow = (row: { id: string; itemName?: string; inkColor: InkColor | null; quantity: number; at: Date; person: string; department: string }): InkRecordRow => ({
    id: row.id,
    model: row.itemName ?? "Ink",
    inkColor: row.inkColor,
    quantity: row.quantity,
    dateLabel: formatInkDate(row.at),
    person: row.person,
    department: row.department,
  });

  return {
    received,
    released,
    remaining,
    lowStockCount: lowStock.length,
    models,
    lowStock,
    receipts: [...periodReceipts]
      .sort((a, b) => b.dateReceived.getTime() - a.dateReceived.getTime())
      .slice(0, 8)
      .map((row) =>
        toRow({
          id: row.id,
          itemName: row.itemName,
          inkColor: row.inkColor,
          quantity: row.quantity,
          at: row.dateReceived,
          person: row.person,
          department: row.department,
        })
      ),
    releases: [...periodReleases]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 8)
      .map((row) => toRow(row)),
  };
}
