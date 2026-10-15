import { IdReleaseForm } from "@/components/id-release-form";
import { IdReleaseTable } from "@/components/id-release-table";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getIdPeriodActivity, listIdReleases } from "@/lib/id-maintenance-data";
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
  const [activity, releases] = await Promise.all([
    getIdPeriodActivity(period),
    listIdReleases(period),
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
  }));

  return (
    <div className="space-y-4">
      <IdReleaseForm />
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
