import { IdBadPrintTable } from "@/components/id-bad-print-table";
import { IdReceiveStockForm } from "@/components/id-receive-stock-form";
import { IdReleaseTable } from "@/components/id-release-table";
import { IdInventoryOverview, IdKpiGrid } from "@/components/id-stock-summary";
import { requireInventorySession } from "@/lib/inventory-auth";
import {
  getIdPeriodActivity,
  getIdStockView,
  listIdBadPrints,
  listIdReleases,
} from "@/lib/id-maintenance-data";
import {
  ID_PERIOD_LABELS,
  formatIdDate,
  parseIdPeriod,
  type IdBadPrintRow,
  type IdReleaseRow,
} from "@/lib/id-maintenance";

export const dynamic = "force-dynamic";

export default async function IdMaintenanceDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const period = parseIdPeriod(params.period);
  const [stock, activity, badPrints, releases] = await Promise.all([
    getIdStockView(),
    getIdPeriodActivity(period),
    listIdBadPrints(period),
    listIdReleases(period),
  ]);

  const badPrintRows: IdBadPrintRow[] = badPrints.map((record) => ({
    id: record.id,
    personName: record.personName,
    course: record.course,
    idNumber: record.idNumber,
    dateLabel: formatIdDate(record.datePrinted),
    status: record.status,
    reason: record.reason,
    quantity: record.quantity,
  }));

  const releaseRows: IdReleaseRow[] = releases.map((record) => ({
    id: record.id,
    personName: record.personName,
    course: record.course,
    idNumber: record.idNumber,
    dateLabel: formatIdDate(record.transactionDate),
    status: record.status,
    reason: record.reason,
    printedBy: record.printedBy,
    idCardsUsed: record.idCardsUsed,
    slingsUsed: record.slingsUsed,
  }));

  return (
    <div className="space-y-4">
      <IdKpiGrid
        stock={stock}
        activity={activity}
        periodLabel={ID_PERIOD_LABELS[period]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.85fr)]">
        <IdInventoryOverview stock={stock} />
        <IdReceiveStockForm
          cardsPerBox={stock.cardsPerBox}
          slingsPerBundle={stock.slingsPerBundle}
        />
      </div>
      <IdBadPrintTable rows={badPrintRows} />
      <IdReleaseTable
        rows={releaseRows}
        cardsUsed={activity.cardsReleased}
        slingsUsed={activity.slingsUsed}
        truncated={activity.releaseCount > releaseRows.length}
      />
    </div>
  );
}
