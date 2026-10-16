import { prisma } from "@/lib/db";
import { IdStockError } from "@/lib/id-maintenance";
import type { InkColor } from "@/lib/inventory";

function normalizeModelName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function modelKey(name: string) {
  return normalizeModelName(name).toLowerCase();
}

async function assertUniqueModelName(name: string, exceptId?: string) {
  const options = await prisma.inkModelOption.findMany({
    select: { id: true, name: true },
  });
  const clash = options.find(
    (option) => option.id !== exceptId && modelKey(option.name) === modelKey(name)
  );
  if (clash) {
    throw new IdStockError("That ink model is already in the list.");
  }
}

async function receiptCountFor(name: string) {
  const groups = await prisma.receivedItem.groupBy({
    by: ["itemName"],
    where: { category: "INK" },
    _count: { _all: true },
  });
  const key = modelKey(name);
  return groups.reduce(
    (sum, group) => (modelKey(group.itemName) === key ? sum + group._count._all : sum),
    0
  );
}

export async function getInkOfficeSettings() {
  return prisma.inkOfficeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", lowStockAtMost: 2 },
  });
}

export async function updateInkOfficeSettings(input: { lowStockAtMost: number }) {
  return prisma.inkOfficeSettings.upsert({
    where: { id: "default" },
    update: { lowStockAtMost: input.lowStockAtMost },
    create: { id: "default", lowStockAtMost: input.lowStockAtMost },
  });
}

export async function listInkModels() {
  const [options, groups] = await Promise.all([
    prisma.inkModelOption.findMany({
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.receivedItem.groupBy({
      by: ["itemName"],
      where: { category: "INK" },
      _count: { _all: true },
    }),
  ]);
  const counts = new Map<string, number>();
  for (const group of groups) {
    const key = modelKey(group.itemName);
    counts.set(key, (counts.get(key) ?? 0) + group._count._all);
  }
  return options.map((option) => ({
    id: option.id,
    name: option.name,
    inkColor: option.inkColor as InkColor,
    active: option.active,
    receiptCount: counts.get(modelKey(option.name)) ?? 0,
  }));
}

export async function listActiveInkModels() {
  const options = await prisma.inkModelOption.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return options.map((option) => ({
    name: option.name,
    inkColor: option.inkColor as InkColor,
  }));
}

export async function createInkModel(input: { name: string; inkColor: InkColor }) {
  const name = normalizeModelName(input.name);
  if (!name) {
    throw new IdStockError("Ink model name is required.");
  }
  await assertUniqueModelName(name);
  const last = await prisma.inkModelOption.aggregate({ _max: { sortOrder: true } });
  return prisma.inkModelOption.create({
    data: {
      name,
      inkColor: input.inkColor,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
}

export async function updateInkModel(
  id: string,
  input: { name?: string; inkColor?: InkColor; active?: boolean }
) {
  const option = await prisma.inkModelOption.findUnique({ where: { id } });
  if (!option) {
    throw new IdStockError("Ink model was not found.");
  }

  const name = input.name === undefined ? option.name : normalizeModelName(input.name);
  if (!name) {
    throw new IdStockError("Ink model name is required.");
  }
  if (modelKey(name) !== modelKey(option.name)) {
    await assertUniqueModelName(name, option.id);
  }

  const receipts = await receiptCountFor(option.name);
  if (input.inkColor && input.inkColor !== option.inkColor && receipts > 0) {
    throw new IdStockError(
      "This model already has receipts, so its color cannot change. Rename it instead."
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (name !== option.name) {
      const matches = await tx.receivedItem.findMany({
        where: { category: "INK" },
        select: { id: true, itemName: true },
      });
      const ids = matches
        .filter((item) => modelKey(item.itemName) === modelKey(option.name))
        .map((item) => item.id);
      if (ids.length > 0) {
        await tx.receivedItem.updateMany({
          where: { id: { in: ids } },
          data: {
            itemName: name,
            model: name.includes(" ") ? name.split(" ").slice(1).join(" ") : name,
          },
        });
      }
    }
    return tx.inkModelOption.update({
      where: { id },
      data: {
        name,
        ...(input.inkColor ? { inkColor: input.inkColor } : {}),
        ...(input.active === undefined ? {} : { active: input.active }),
      },
    });
  });

  return updated;
}

export async function removeInkModel(id: string) {
  const option = await prisma.inkModelOption.findUnique({ where: { id } });
  if (!option) {
    throw new IdStockError("Ink model was not found.");
  }
  const receipts = await receiptCountFor(option.name);
  if (receipts > 0) {
    await prisma.inkModelOption.update({
      where: { id },
      data: { active: false },
    });
    return { deactivated: true as const };
  }
  await prisma.inkModelOption.delete({ where: { id } });
  return { deactivated: false as const };
}
