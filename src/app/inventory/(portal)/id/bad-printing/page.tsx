import { IdBadPrintForm } from "@/components/id-bad-print-form";
import { IdBadPrintTable } from "@/components/id-bad-print-table";
import { requireInventorySession } from "@/lib/inventory-auth";
import { listIdBadPrints } from "@/lib/id-maintenance-data";
import { formatIdDate, parseIdPeriod, type IdBadPrintRow } from "@/lib/id-maintenance";

export const dynamic = "force-dynamic";

export default async function BadPrintingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const period = parseIdPeriod(params.period);
  const records = await listIdBadPrints(period);
  const rows: IdBadPrintRow[] = records.map((record) => ({
    id: record.id,
    personName: record.personName,
    course: record.course,
    idNumber: record.idNumber,
    dateLabel: formatIdDate(record.datePrinted),
    status: record.status,
    reason: record.reason,
    quantity: record.quantity,
  }));

  return (
    <div className="space-y-5 sm:space-y-6">
      <IdBadPrintForm />
      <IdBadPrintTable rows={rows} showActions />
    </div>
  );
}
