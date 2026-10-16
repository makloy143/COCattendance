import { prisma } from "@/lib/db";
import { getIdPeriodRange, parseIdPeriod, type IdPeriod } from "@/lib/id-maintenance";
import { getAvailableQuantity, getReleasedQuantity, type InkColor } from "@/lib/inventory";
import { buildInkDashboard } from "@/lib/ink-dashboard";
import { getInkOfficeSettings, listActiveInkModels } from "@/lib/ink-settings";

export async function getInkDashboard(periodValue?: string | null, recordLimit = 8) {
  const period: IdPeriod = parseIdPeriod(periodValue);
  const range = getIdPeriodRange(period);
  const [settings, catalog, items] = await Promise.all([
    getInkOfficeSettings(),
    listActiveInkModels(),
    prisma.receivedItem.findMany({
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
  }),
  ]);

  return buildInkDashboard({
    range,
    recordLimit,
    models: catalog,
    lowStockAtMost: settings.lowStockAtMost,
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
