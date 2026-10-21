import { prisma } from "@/lib/db";
import { IdStockError } from "@/lib/id-maintenance";
import { getAvailableQuantity } from "@/lib/inventory";

function modelKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

async function deleteInkItems(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.receivedItem.deleteMany({ where: { id: { in: ids } } });
}

export async function deleteInkReceiptsByName(name: string) {
  const items = await prisma.receivedItem.findMany({
    where: { category: "INK" },
    select: { id: true, itemName: true },
  });
  const key = modelKey(name);
  const ids = items.filter((item) => modelKey(item.itemName) === key).map((item) => item.id);
  await deleteInkItems(ids);
  return ids.length;
}

export async function deleteInactiveInkReceipts() {
  const inactive = await prisma.inkModelOption.findMany({
    where: { active: false },
    select: { name: true },
  });
  const keys = new Set(inactive.map((model) => modelKey(model.name)));
  if (keys.size === 0) return 0;
  const items = await prisma.receivedItem.findMany({
    where: { category: "INK" },
    select: { id: true, itemName: true },
  });
  const ids = items.filter((item) => keys.has(modelKey(item.itemName))).map((item) => item.id);
  await deleteInkItems(ids);
  return ids.length;
}

export async function clearAvailableInkStock(input: {
  receiptId?: string;
  modelName?: string;
}) {
  const items = await prisma.receivedItem.findMany({
    where: {
      category: "INK",
      ...(input.receiptId ? { id: input.receiptId } : {}),
    },
    include: {
      borrows: { select: { quantityBorrowed: true, status: true } },
    },
  });

  if (input.receiptId && items.length === 0) {
    throw new IdStockError("Ink receipt was not found.");
  }

  const model = input.modelName ? modelKey(input.modelName) : null;
  const targets = model ? items.filter((item) => modelKey(item.itemName) === model) : items;
  if (targets.length === 0) {
    throw new IdStockError("That ink model has no stock to clear.");
  }

  const cleared = targets.reduce((sum, item) => sum + getAvailableQuantity(item), 0);
  if (cleared <= 0 && !input.receiptId) {
    throw new IdStockError("There is no available ink stock to clear.");
  }

  await deleteInkItems(targets.map((item) => item.id));
  return { cleared };
}

export async function removeInkRelease(id: string) {
  const borrow = await prisma.borrowRecord.findUnique({
    where: { id },
    include: {
      receivedItem: {
        include: { borrows: { select: { id: true, quantityBorrowed: true, status: true } } },
      },
    },
  });
  if (!borrow || borrow.receivedItem.category !== "INK") {
    throw new IdStockError("Ink release was not found.");
  }

  const item = borrow.receivedItem;
  const nextQuantity = Math.max(0, item.quantity - borrow.quantityBorrowed);
  const remainingBorrows = item.borrows.filter((row) => row.id !== borrow.id);

  await prisma.$transaction(async (tx) => {
    await tx.borrowRecord.delete({ where: { id: borrow.id } });
    if (nextQuantity <= 0 && remainingBorrows.length === 0) {
      await tx.receivedItem.delete({ where: { id: item.id } });
      return;
    }
    await tx.receivedItem.update({
      where: { id: item.id },
      data: { quantity: nextQuantity },
    });
  });

  return { removed: true as const };
}

export async function updateInkReleaseDepartment(id: string, department: string) {
  const borrow = await prisma.borrowRecord.findUnique({
    where: { id },
    include: { receivedItem: { select: { category: true } } },
  });
  if (!borrow || borrow.receivedItem.category !== "INK") {
    throw new IdStockError("Ink release was not found.");
  }
  const next = department.trim();
  const known = await prisma.inventoryDepartment.findMany({
    where: { active: true },
    select: { name: true },
  });
  if (known.length > 0 && !known.some((row) => row.name === next)) {
    throw new IdStockError("Choose a department from Settings.");
  }
  return prisma.borrowRecord.update({
    where: { id },
    data: { department: next },
  });
}
