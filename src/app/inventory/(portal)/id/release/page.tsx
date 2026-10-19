import { IdReleaseForm } from "@/components/id-release-form";
import { IdReleaseTable } from "@/components/id-release-table";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getIdPeriodActivity, getIdStockView, listIdReleases } from "@/lib/id-maintenance-data";
import { formatIdDate, parseIdPeriod, type IdReleaseRow } from "@/lib/id-maintenance";

export const dynamic = "force-dynamic";

export default async function IdReleasePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const period = parseIdPeriod(params.period);
  const [activity, releases, stock] = await Promise.all([
    getIdPeriodActivity(period),
    listIdReleases(period),
    getIdStockView(),
  ]);

  const rows: IdReleaseRow[] = releases.map((record) => ({
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
  }));

  return (
    <div className="space-y-4">
      <IdReleaseForm boxes={stock.cardBoxes.filter((box) => box.remaining > 0)} />
      <IdReleaseTable
        rows={rows}
        cardsUsed={activity.cardsReleased}
        slingsUsed={activity.slingsUsed}
        showActions
        truncated={activity.releaseCount > rows.length}
      />
    </div>
  );
}
