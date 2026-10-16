import { getManilaDayEnd, getManilaDayStart, formatManilaDateInput } from "@/lib/date-utils";
import { INK_MODEL_PRESETS, type InkColor } from "@/lib/inventory";

export const INK_LOW_STOCK_AT_MOST = 2;

export const INK_CHART_COLORS: Record<InkColor, string> = {
  BLACK: "#171717",
  MAGENTA: "#ec4899",
  CYAN: "#22d3ee",
  YELLOW: "#facc15",
  OTHER: "#94a3b8",
};

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
  from: string;
  to: string;
  received: number;
  released: number;
  receivedChange: number | null;
  releasedChange: number | null;
  remaining: number;
  lowStockCount: number;
  models: InkModelStock[];
  lowStock: { name: string; balance: number; inkColor: InkColor | null }[];
  trend: { label: string; received: number; released: number }[];
  receipts: InkRecordRow[];
  releases: InkRecordRow[];
};

export function defaultInkRange(now = new Date()) {
  const today = formatManilaDateInput(now);
  return { from: `${today.slice(0, 4)}-01-01`, to: today };
}

export function parseInkRange(fromValue?: string | null, toValue?: string | null, now = new Date()) {
  const fallback = defaultInkRange(now);
  const from = isDateKey(fromValue) ? fromValue : fallback.from;
  const to = isDateKey(toValue) ? toValue : fallback.to;
  if (from <= to) return { from, to };
  return { from: to, to: from };
}

function isDateKey(value?: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function inkChangePercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

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

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(`${year}-${month}-01T00:00:00+08:00`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    year: "numeric",
  }).format(date);
}

function monthsInRange(from: string, to: string) {
  const months: string[] = [];
  let cursor = from.slice(0, 7);
  const end = to.slice(0, 7);
  while (cursor <= end && months.length < 36) {
    months.push(cursor);
    const [year, month] = cursor.split("-").map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    cursor = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
  }
  return months;
}

function inRange(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function buildInkDashboard(input: {
  receipts: InkReceiptSource[];
  releases: InkMovement[];
  from: string;
  to: string;
}): InkDashboardView {
  const start = getManilaDayStart(input.from);
  const end = getManilaDayEnd(input.to);
  const length = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - length);

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

  const periodReceipts = input.receipts.filter((row) => inRange(row.dateReceived, start, end));
  const previousReceipts = input.receipts.filter((row) =>
    inRange(row.dateReceived, previousStart, previousEnd)
  );
  const periodReleases = input.releases.filter((row) => inRange(row.at, start, end));
  const previousReleases = input.releases.filter((row) => inRange(row.at, previousStart, previousEnd));

  const received = periodReceipts.reduce((sum, row) => sum + row.quantity, 0);
  const released = periodReleases.reduce((sum, row) => sum + row.quantity, 0);
  const previousReceived = previousReceipts.reduce((sum, row) => sum + row.quantity, 0);
  const previousReleased = previousReleases.reduce((sum, row) => sum + row.quantity, 0);

  const trendMap = new Map(monthsInRange(input.from, input.to).map((month) => [month, { received: 0, released: 0 }]));
  for (const row of periodReceipts) {
    const bucket = trendMap.get(formatManilaDateInput(row.dateReceived).slice(0, 7));
    if (bucket) bucket.received += row.quantity;
  }
  for (const row of periodReleases) {
    const bucket = trendMap.get(formatManilaDateInput(row.at).slice(0, 7));
    if (bucket) bucket.released += row.quantity;
  }

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
    from: input.from,
    to: input.to,
    received,
    released,
    receivedChange: inkChangePercent(received, previousReceived),
    releasedChange: inkChangePercent(released, previousReleased),
    remaining,
    lowStockCount: lowStock.length,
    models,
    lowStock,
    trend: [...trendMap.entries()].map(([month, values]) => ({
      label: monthLabel(month),
      received: values.received,
      released: values.released,
    })),
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
