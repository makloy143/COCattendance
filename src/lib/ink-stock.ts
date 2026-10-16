import { prisma } from "@/lib/db";
import { IdStockError } from "@/lib/id-maintenance";
import { getAvailableQuantity, getBorrowedQuantity } from "@/lib/inventory";

function modelKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
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
  if (model && targets.length === 0) {
    throw new IdStockError("That ink model has no stock to clear.");
  }

  let cleared = 0;
  await prisma.$transaction(async (tx) => {
    for (const item of targets) {
      const available = getAvailableQuantity(item);
      if (available <= 0) continue;
      cleared += available;
      const kept = getBorrowedQuantity(item.borrows);
      if (item.borrows.length === 0) {
        await tx.receivedItem.delete({ where: { id: item.id } });
      } else {
        await tx.receivedItem.update({
          where: { id: item.id },
          data: { quantity: kept },
        });
      }
    }
  });

  if (cleared === 0) {
    throw new IdStockError("There is no available ink stock to clear.");
  }

  return { cleared };
}
