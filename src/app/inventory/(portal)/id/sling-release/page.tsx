import { IdSlingReleaseForm } from "@/components/id-sling-release-form";
import { IdSlingReleaseTable } from "@/components/id-sling-release-table";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getIdPeriodActivity, getIdStockView, listIdReleases } from "@/lib/id-maintenance-data";
import { parseIdPeriod, toIdReleaseRow } from "@/lib/id-maintenance";

export const dynamic = "force-dynamic";

export default async function SlingReleasePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const period = parseIdPeriod(params.period);
  const [activity, releases, stock] = await Promise.all([
    getIdPeriodActivity(period),
    listIdReleases(period, { slingsOnly: true }),
    getIdStockView(),
  ]);

  const rows = releases.map((record) => toIdReleaseRow(record));

  return (
    <div className="space-y-4">
      <IdSlingReleaseForm
        studentRemaining={stock.studentSlingsRemaining}
        employeeRemaining={stock.employeeSlingsRemaining}
      />
      <IdSlingReleaseTable
        rows={rows}
        slingsUsed={activity.slingsUsed}
        truncated={rows.length >= 300}
      />
    </div>
  );
}
