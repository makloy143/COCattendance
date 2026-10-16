import type { InkColor } from "@/lib/inventory";

export const INK_LOW_STOCK_AT_MOST = 2;

export type InkCatalogModel = {
  name: string;
  inkColor: InkColor;
};

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
  available?: number;
  dateLabel: string;
  person: string;
  department: string;
};

export type InkDashboardView = {
  received: number;
  released: number;
  remaining: number;
  lowStockCount: number;
  lowStockAtMost: number;
  catalog: InkCatalogModel[];
  models: InkModelStock[];
  lowStock: { name: string; balance: number; inkColor: InkColor | null }[];
  receipts: InkRecordRow[];
  releases: InkRecordRow[];
};

function modelKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase() || "ink";
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
  models: InkCatalogModel[];
  lowStockAtMost?: number;
  recordLimit?: number;
}): InkDashboardView {
  const matches = (date: Date) =>
    !input.range || inRange(date, input.range.start, input.range.end);
  const lowStockAtMost = input.lowStockAtMost ?? INK_LOW_STOCK_AT_MOST;

  const byName = new Map<string, InkModelStock>();
  const ordered: InkModelStock[] = [];
  for (const preset of input.models) {
    const row: InkModelStock = {
      key: preset.name,
      name: preset.name,
      inkColor: preset.inkColor,
      received: 0,
      released: 0,
      balance: 0,
    };
    byName.set(modelKey(preset.name), row);
    ordered.push(row);
  }

  const extras: InkModelStock[] = [];
  for (const receipt of input.receipts) {
    const key = modelKey(receipt.itemName);
    const current = byName.get(key) ?? {
      key: receipt.itemName.trim() || "Ink",
      name: receipt.itemName.trim() || "Ink",
      inkColor: receipt.inkColor,
      received: 0,
      released: 0,
      balance: 0,
    };
    if (!byName.has(key)) {
      byName.set(key, current);
      extras.push(current);
    }
    current.received += receipt.quantity;
    current.released += receipt.released;
    current.balance += receipt.balance;
    if (!current.inkColor && receipt.inkColor) current.inkColor = receipt.inkColor;
  }

  extras.sort((a, b) => a.name.localeCompare(b.name));
  const models = [...ordered, ...extras];
  const remaining = models.reduce((sum, model) => sum + model.balance, 0);
  const lowStock = models
    .filter((model) => model.received > 0 && model.balance <= lowStockAtMost)
    .map((model) => ({ name: model.name, balance: model.balance, inkColor: model.inkColor }))
    .sort((a, b) => a.balance - b.balance || a.name.localeCompare(b.name));

  const periodReceipts = input.receipts.filter((row) => matches(row.dateReceived));
  const periodReleases = input.releases.filter((row) => matches(row.at));
  const recordLimit = input.recordLimit ?? 8;
  const received = periodReceipts.reduce((sum, row) => sum + row.quantity, 0);
  const released = periodReleases.reduce((sum, row) => sum + row.quantity, 0);

  const toRow = (row: {
    id: string;
    itemName?: string;
    inkColor: InkColor | null;
    quantity: number;
    available?: number;
    at: Date;
    person: string;
    department: string;
  }): InkRecordRow => ({
    id: row.id,
    model: row.itemName ?? "Ink",
    inkColor: row.inkColor,
    quantity: row.quantity,
    available: row.available,
    dateLabel: formatInkDate(row.at),
    person: row.person,
    department: row.department,
  });

  return {
    received,
    released,
    remaining,
    lowStockCount: lowStock.length,
    lowStockAtMost,
    catalog: input.models,
    models,
    lowStock,
    receipts: [...periodReceipts]
      .sort((a, b) => b.dateReceived.getTime() - a.dateReceived.getTime())
      .slice(0, recordLimit)
      .map((row) =>
        toRow({
          id: row.id,
          itemName: row.itemName,
          inkColor: row.inkColor,
          quantity: row.quantity,
          available: row.balance,
          at: row.dateReceived,
          person: row.person,
          department: row.department,
        })
      ),
    releases: [...periodReleases]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, recordLimit)
      .map((row) => toRow(row)),
  };
}
