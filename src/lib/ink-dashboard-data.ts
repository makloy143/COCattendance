import { prisma } from "@/lib/db";
import { getAvailableQuantity, getReleasedQuantity, type InkColor } from "@/lib/inventory";
import { buildInkDashboard, parseInkRange } from "@/lib/ink-dashboard";

export async function getInkDashboard(fromValue?: string | null, toValue?: string | null) {
  const range = parseInkRange(fromValue, toValue);
  const items = await prisma.receivedItem.findMany({
    where: { category: "INK" },
    include: {
      borrows: {
        select: {
          id: true,
          quantityBorrowed: true,
          status: true,
          borrowerName: true,
          department: true,
          dateBorrowed: true,
        },
      },
    },
    orderBy: [{ dateReceived: "desc" }, { createdAt: "desc" }],
  });

  return buildInkDashboard({
    from: range.from,
    to: range.to,
    receipts: items.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      inkColor: item.inkColor as InkColor | null,
      quantity: item.quantity,
      dateReceived: item.dateReceived,
      person: item.senderName,
      department: item.receivedByDepartment,
      released: getReleasedQuantity(item.borrows),
      balance: getAvailableQuantity(item),
    })),
    releases: items.flatMap((item) =>
      item.borrows.map((borrow) => ({
        id: borrow.id,
        itemName: item.itemName,
        inkColor: item.inkColor as InkColor | null,
        quantity: borrow.quantityBorrowed,
        at: borrow.dateBorrowed,
        person: borrow.borrowerName,
        department: borrow.department,
      }))
    ),
  });
}
