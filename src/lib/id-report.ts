import { formatManilaDateInput } from "@/lib/date-utils";
import { buildExcelDocument } from "@/lib/excel-table";
import {
  getIdPeriodActivity,
  getIdStockView,
  listIdBadPrints,
  listIdReceipts,
  listIdReleases,
} from "@/lib/id-maintenance-data";
import {
  ID_PERIOD_LABELS,
  ID_RELEASE_STATUS_LABELS,
  formatIdDate,
  getIdPeriodRange,
  parseIdPeriod,
  receiptItemTitle,
  wastesCardStock,
  type IdPeriod,
  type IdReleaseStatus,
} from "@/lib/id-maintenance";

export async function buildIdReportWorkbook(periodValue?: string | null) {
  const period: IdPeriod = parseIdPeriod(periodValue);
  const range = getIdPeriodRange(period);
  const [stock, activity, receipts, releases, badPrints] = await Promise.all([
    getIdStockView(),
    getIdPeriodActivity(period),
    listIdReceipts(),
    listIdReleases(period),
    listIdBadPrints(period),
  ]);

  const periodReceipts = receipts.filter((receipt) => {
    if (!range) return true;
    return receipt.dateReceived >= range.start && receipt.dateReceived <= range.end;
  });

  const reasons = new Map<string, { count: number; quantity: number }>();
  for (const record of badPrints) {
    if (!wastesCardStock(record.status)) continue;
    const current = reasons.get(record.reason) ?? { count: 0, quantity: 0 };
    current.count += 1;
    current.quantity += record.quantity;
    reasons.set(record.reason, current);
  }

  const printers = new Map<string, { cards: number; slings: number }>();
  for (const release of releases) {
    const current = printers.get(release.printedBy) ?? { cards: 0, slings: 0 };
    current.cards += release.idCardsUsed;
    current.slings += release.slingsUsed;
    printers.set(release.printedBy, current);
  }

  const periodLabel = ID_PERIOD_LABELS[period];
  const buffer = buildExcelDocument(`ID Inventory Report · ${periodLabel}`, [
    {
      heading: "Summary",
      headers: ["Item", "Value"],
      rows: [
        ["Period", periodLabel],
        ["Cards received", stock.cardsReceived],
        ["Cards released (all time)", stock.cardsReleased],
        ["Cards wasted (all time)", stock.cardsWasted],
        ["Cards remaining", stock.cardsRemaining],
        ["Student slings remaining", stock.studentSlingsRemaining],
        ["Employee slings remaining", stock.employeeSlingsRemaining],
        ["Cards released", activity.cardsReleased],
        ["Cards wasted", activity.cardsWasted],
        ["Slings used", activity.slingsUsed],
        ["Release records", activity.releaseCount],
      ],
    },
    {
      heading: "Printing errors by reason",
      headers: ["Reason", "Records", "Cards wasted"],
      rows: Array.from(reasons.entries())
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .map(([reason, totals]) => [reason, totals.count, totals.quantity]),
    },
    {
      heading: "Usage by person who printed",
      headers: ["Printed by", "ID cards used", "Slings used"],
      rows: Array.from(printers.entries())
        .sort((a, b) => b[1].cards - a[1].cards)
        .map(([name, totals]) => [name, totals.cards, totals.slings]),
    },
    {
      heading: "Stock movements",
      headers: ["Date", "Item", "Packs", "Units added", "Received from"],
      rows: periodReceipts.map((receipt) => [
        formatIdDate(receipt.dateReceived),
        receiptItemTitle(receipt),
        receipt.packsReceived,
        receipt.unitsAdded,
        receipt.receivedFrom,
      ]),
    },
    {
      heading: "Transaction history",
      headers: ["Date", "Name", "Status", "Reason", "Printed by", "PVC card", "Cards", "Slings"],
      rows: releases.map((release) => [
        formatIdDate(release.transactionDate),
        release.personName,
        ID_RELEASE_STATUS_LABELS[release.status as IdReleaseStatus] ?? release.status,
        release.reason,
        release.printedBy,
        release.pvcCardName
          ? `${release.pvcCardName}${release.pvcCardEnded ? " · ended" : ""}`
          : "",
        release.idCardsUsed,
        release.slingsUsed > 0
          ? `${release.slingsUsed} ${release.slingKind === "EMPLOYEE" ? "employee" : "student"}`
          : release.slingsUsed,
      ]),
    },
  ]);

  return {
    buffer,
    filename: `id-inventory-report_${period}_${formatManilaDateInput(new Date())}.xls`,
  };
}
