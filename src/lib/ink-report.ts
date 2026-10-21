import { formatManilaDateInput } from "@/lib/date-utils";
import { buildExcelDocument } from "@/lib/excel-table";
import { ID_PERIOD_LABELS, parseIdPeriod, type IdPeriod } from "@/lib/id-maintenance";
import { getInkDashboard } from "@/lib/ink-dashboard-data";
import { INK_COLOR_LABELS } from "@/lib/inventory";

export async function buildInkReportWorkbook(periodValue?: string | null) {
  const period = parseIdPeriod(periodValue);
  const view = await getInkDashboard(period, 1000);
  const periodLabel = ID_PERIOD_LABELS[period];
  const buffer = buildExcelDocument(`Ink Inventory Report · ${periodLabel}`, [
    {
      heading: "Summary",
      headers: ["Item", "Value"],
      rows: [
        ["Period", periodLabel],
        ["Bottles received", view.received],
        ["Bottles released", view.released],
        ["Bottles remaining", view.remaining],
        ["Low stock models", view.lowStockCount],
      ],
    },
    {
      heading: "Stock by model",
      headers: ["Ink model", "Color", "Received", "Released", "Remaining"],
      rows: view.models.map((model) => [
        model.name,
        model.inkColor ? INK_COLOR_LABELS[model.inkColor] : "",
        model.received,
        model.released,
        model.balance,
      ]),
    },
    {
      heading: "Receiving records",
      headers: ["Date", "Ink model", "Qty", "Available", "Received by", "Department"],
      rows: view.receipts.map((row) => [
        row.dateLabel,
        row.model,
        row.quantity,
        row.available ?? 0,
        row.person,
        row.department,
      ]),
    },
    {
      heading: "Release records",
      headers: ["Date", "Ink model", "Qty", "Released to", "Department"],
      rows: view.releases.map((row) => [
        row.dateLabel,
        row.model,
        row.quantity,
        row.person,
        row.department,
      ]),
    },
  ]);

  return {
    buffer,
    filename: `ink-inventory-report_${period}_${formatManilaDateInput(new Date())}.xls`,
    period: period satisfies IdPeriod,
    view,
    periodLabel,
  };
}
