import { IdReleaseForm } from "@/components/id-release-form";
import { IdReleaseTable } from "@/components/id-release-table";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getIdPeriodActivity, getIdStockView, listIdReleases } from "@/lib/id-maintenance-data";
import { parseIdPeriod, toIdReleaseRow } from "@/lib/id-maintenance";

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

  const rows = releases.map((record) => toIdReleaseRow(record));

  return (
    <div className="space-y-5 sm:space-y-6">
      <IdReleaseForm
        boxes={stock.cardBoxes.filter((box) => box.remaining > 0)}
        continueBoxId={stock.currentCardBoxId}
      />
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
