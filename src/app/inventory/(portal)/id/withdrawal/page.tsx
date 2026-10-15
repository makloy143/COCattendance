import { IdSurrenderForm } from "@/components/id-surrender-form";
import { IdSurrenderTable } from "@/components/id-surrender-table";
import { requireInventorySession } from "@/lib/inventory-auth";
import { listIdSurrenders } from "@/lib/id-maintenance-data";
import { formatIdDate, parseIdPeriod, type IdSurrenderRow } from "@/lib/id-maintenance";

export const dynamic = "force-dynamic";

export default async function IdWithdrawalPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const period = parseIdPeriod(params.period);
  const records = await listIdSurrenders(period);
  const rows: IdSurrenderRow[] = records.map((record) => ({
    id: record.id,
    personName: record.personName,
    course: record.course,
    yearLevel: record.yearLevel,
    idNumber: record.idNumber,
    dateLabel: formatIdDate(record.surrenderDate),
    idCardsReturned: record.idCardsReturned,
    slingsReturned: record.slingsReturned,
    receivedBy: record.receivedBy,
  }));

  return (
    <div className="space-y-4">
      <IdSurrenderForm />
      <IdSurrenderTable rows={rows} showActions />
    </div>
  );
}
