import { IdBadPrintTable } from "@/components/id-bad-print-table";
import { IdSurrenderTable } from "@/components/id-surrender-table";
import { IdReceiveStockForm } from "@/components/id-receive-stock-form";
import { IdReleaseTable } from "@/components/id-release-table";
import { IdInventoryOverview, IdKpiGrid } from "@/components/id-stock-summary";
import { requireInventorySession } from "@/lib/inventory-auth";
import {
  getIdPeriodActivity,
  getIdStockView,
  listIdBadPrints,
  listIdItemOptions,
  listIdReleases,
  listIdSurrenders,
} from "@/lib/id-maintenance-data";
import {
  ID_PERIOD_LABELS,
  formatIdDate,
  parseIdPeriod,
  type IdBadPrintRow,
  type IdReleaseRow,
  type IdSurrenderRow,
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
  const [stock, activity, badPrints, releases, itemTypes, surrenders] = await Promise.all([
    getIdStockView(),
    getIdPeriodActivity(period),
    listIdBadPrints(period),
    listIdReleases(period),
    listIdItemOptions({ activeOnly: true }),
    listIdSurrenders(period),
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
    slingKind: record.slingKind,
    pvcCardName: record.pvcCardName,
    pvcCardEnded: record.pvcCardEnded,
  }));

  const surrenderRows: IdSurrenderRow[] = surrenders.map((record) => ({
    id: record.id,
    personName: record.personName,
    course: record.course,
    yearLevel: record.yearLevel,
    idNumber: record.idNumber,
    dateLabel: formatIdDate(record.surrenderDate),
    reason: record.reason,
    idCardsReturned: record.idCardsReturned,
    slingsReturned: record.slingsReturned,
    receivedBy: record.receivedBy,
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
          options={itemTypes.map((option) => ({
            id: option.id,
            name: option.name,
            category: option.category,
          }))}
        />
      </div>
      <IdBadPrintTable rows={badPrintRows} />
      <IdReleaseTable
        rows={releaseRows}
        cardsUsed={activity.cardsReleased}
        slingsUsed={activity.slingsUsed}
        truncated={activity.releaseCount > releaseRows.length}
      />
      <IdSurrenderTable rows={surrenderRows} />
    </div>
  );
}
