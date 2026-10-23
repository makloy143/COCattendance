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
  categoryForItemType,
  formatIdDate,
  formatReleaseAmount,
  getIdPeriodRange,
  parseIdPeriod,
  receiptItemTitle,
  wastesCardStock,
  type IdPeriod,
  type IdReleaseStatus,
  type IdStockView,
} from "@/lib/id-maintenance";

function stockKind(receipt: {
  itemType: Parameters<typeof categoryForItemType>[0];
  itemOption?: { category: string } | null;
}) {
  const category = receipt.itemOption?.category ?? categoryForItemType(receipt.itemType);
  if (category === "ID_CARD") return "card";
  if (category === "SLING_STUDENT" || category === "SLING_EMPLOYEE") return "sling";
  return "other";
}

export async function loadIdReport(periodValue?: string | null) {
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

  const cardPrinters = new Map<string, number>();
  const slingReleasers = new Map<string, number>();
  let studentSlingsUsed = 0;
  let employeeSlingsUsed = 0;
  for (const release of releases) {
    if (release.idCardsUsed > 0) {
      cardPrinters.set(release.printedBy, (cardPrinters.get(release.printedBy) ?? 0) + release.idCardsUsed);
    }
    if (release.slingsUsed > 0) {
      const name = release.releasedBy || release.printedBy;
      slingReleasers.set(name, (slingReleasers.get(name) ?? 0) + release.slingsUsed);
      if (release.slingKind === "EMPLOYEE") employeeSlingsUsed += release.slingsUsed;
      else studentSlingsUsed += release.slingsUsed;
    }
  }

  return {
    period,
    periodLabel: ID_PERIOD_LABELS[period],
    stock: stock satisfies IdStockView,
    activity,
    cardReleases: releases.filter((release) => release.status !== "SLING"),
    slingReleases: releases.filter((release) => release.slingsUsed > 0),
    cardReceipts: periodReceipts.filter((receipt) => stockKind(receipt) === "card"),
    slingReceipts: periodReceipts.filter((receipt) => stockKind(receipt) === "sling"),
    otherReceipts: periodReceipts.filter((receipt) => stockKind(receipt) === "other"),
    reasonRows: Array.from(reasons.entries()).sort((a, b) => b[1].quantity - a[1].quantity),
    cardPrinterRows: Array.from(cardPrinters.entries()).sort((a, b) => b[1] - a[1]),
    slingReleaserRows: Array.from(slingReleasers.entries()).sort((a, b) => b[1] - a[1]),
    studentSlingsUsed,
    employeeSlingsUsed,
  };
}

export async function buildIdReportWorkbook(periodValue?: string | null) {
  const report = await loadIdReport(periodValue);
  const buffer = buildExcelDocument(`ID Inventory Report · ${report.periodLabel}`, [
    {
      heading: "ID card summary",
      headers: ["Item", "Value"],
      rows: [
        ["Period", report.periodLabel],
        ["Cards received", report.stock.cardsReceived],
        ["Cards released this period", report.activity.cardsReleased],
        ["Cards wasted this period", report.activity.cardsWasted],
        ["Cards remaining", report.stock.cardsRemaining],
        ["ID card release records", report.cardReleases.length],
      ],
    },
    {
      heading: "ID sling summary",
      headers: ["Item", "Value"],
      rows: [
        ["Period", report.periodLabel],
        ["Student slings used", report.studentSlingsUsed],
        ["Employee slings used", report.employeeSlingsUsed],
        ["Slings used", report.activity.slingsUsed],
        ["Student slings remaining", report.stock.studentSlingsRemaining],
        ["Employee slings remaining", report.stock.employeeSlingsRemaining],
        ["Sling release records", report.slingReleases.length],
      ],
    },
    {
      heading: "ID card bad printing",
      headers: ["Category", "Records", "Cards wasted"],
      rows: report.reasonRows.map(([reason, totals]) => [reason, totals.count, totals.quantity]),
    },
    {
      heading: "ID cards by printer",
      headers: ["Printed by", "ID cards used"],
      rows: report.cardPrinterRows.map(([name, cards]) => [name, cards]),
    },
    {
      heading: "ID slings by person",
      headers: ["Released by", "Slings used"],
      rows: report.slingReleaserRows.map(([name, slings]) => [name, slings]),
    },
    {
      heading: "ID card releases",
      headers: [
        "Date",
        "Name",
        "ID #",
        "Status",
        "Category",
        "OR",
        "Amount",
        "Printer",
        "Printed by",
        "Released by",
        "Cards",
      ],
      rows: report.cardReleases.map((release) => [
        formatIdDate(release.transactionDate),
        release.personName,
        release.idNumber,
        ID_RELEASE_STATUS_LABELS[release.status as IdReleaseStatus] ?? release.status,
        release.reason,
        release.orNumber ?? "",
        formatReleaseAmount(release.amount),
        release.printerUsed ?? "",
        release.printedBy,
        release.releasedBy ?? "",
        release.idCardsUsed,
      ]),
    },
    {
      heading: "ID sling releases",
      headers: ["Date", "Name", "ID #", "Category", "Released by", "Sling for", "Slings"],
      rows: report.slingReleases.map((release) => [
        formatIdDate(release.transactionDate),
        release.personName,
        release.idNumber,
        release.reason,
        release.releasedBy || release.printedBy,
        release.slingKind === "EMPLOYEE" ? "Employee" : "Student",
        release.slingsUsed,
      ]),
    },
    {
      heading: "ID card stock received",
      headers: ["Date", "Item", "Packs", "Units added", "Received from"],
      rows: report.cardReceipts.map((receipt) => [
        formatIdDate(receipt.dateReceived),
        receiptItemTitle(receipt),
        receipt.packsReceived,
        receipt.unitsAdded,
        receipt.receivedFrom,
      ]),
    },
    {
      heading: "ID sling stock received",
      headers: ["Date", "Item", "Packs", "Units added", "Received from"],
      rows: report.slingReceipts.map((receipt) => [
        formatIdDate(receipt.dateReceived),
        receiptItemTitle(receipt),
        receipt.packsReceived,
        receipt.unitsAdded,
        receipt.receivedFrom,
      ]),
    },
  ]);

  return {
    buffer,
    filename: `id-inventory-report_${report.period}_${formatManilaDateInput(new Date())}.xls`,
  };
}
