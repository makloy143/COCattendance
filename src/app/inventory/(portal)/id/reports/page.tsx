import { ReportExcelButton } from "@/components/report-excel-button";
import { IdInventoryOverview } from "@/components/id-stock-summary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireInventorySession } from "@/lib/inventory-auth";
import { loadIdReport } from "@/lib/id-report";
import {
  ID_RELEASE_STATUS_LABELS,
  formatCount,
  formatIdDate,
  formatReleaseAmount,
  receiptItemTitle,
  type IdReleaseStatus,
} from "@/lib/id-maintenance";

export const dynamic = "force-dynamic";

export default async function IdReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const report = await loadIdReport(params.period);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          ID cards and ID slings are reported separately for {report.periodLabel}. Remaining stock is the current balance.
        </p>
        <ReportExcelButton endpoint="/api/inventory/id/reports" period={report.period} />
      </div>
      <IdInventoryOverview stock={report.stock} />

      <section className="space-y-4 sm:space-y-5">
        <h2 className="text-base font-semibold">ID cards</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Cards released", report.activity.cardsReleased],
            ["Cards wasted", report.activity.cardsWasted],
            ["Card release records", report.cardReleases.length],
          ].map(([label, value]) => (
            <article key={String(label)} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
              <p className="text-sm text-slate-500">
                {label} · {report.periodLabel}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCount(Number(value))}</p>
            </article>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <SimpleTable
            title="Bad printing by category"
            headers={["Category", "Records", "Cards wasted"]}
            rows={report.reasonRows.map(([reason, totals]) => [reason, totals.count, totals.quantity])}
            empty="No wasted cards in this period."
          />
          <SimpleTable
            title="Cards by person who printed"
            headers={["Printed by", "ID cards used"]}
            rows={report.cardPrinterRows}
            empty="No ID card releases in this period."
          />
        </div>
        <SimpleTable
          title="ID card releases"
          headers={["Date", "Name", "ID #", "Status", "Category", "OR", "Amount", "Printer", "Printed by", "Released by", "Cards"]}
          rows={report.cardReleases.map((release) => [
            formatIdDate(release.transactionDate),
            release.personName,
            release.idNumber,
            ID_RELEASE_STATUS_LABELS[release.status as IdReleaseStatus] ?? release.status,
            release.reason,
            release.orNumber || "—",
            formatReleaseAmount(release.amount) || "—",
            release.printerUsed || "—",
            release.printedBy,
            release.releasedBy || "—",
            release.idCardsUsed,
          ])}
          empty="No ID card releases in this period."
        />
        <SimpleTable
          title="ID card stock received"
          headers={["Date", "Item", "Packs", "Units added", "Received from"]}
          rows={report.cardReceipts.map((receipt) => [
            formatIdDate(receipt.dateReceived),
            receiptItemTitle(receipt),
            receipt.packsReceived,
            receipt.unitsAdded,
            receipt.receivedFrom,
          ])}
          empty="No ID cards received in this period."
        />
      </section>

      <section className="space-y-4 sm:space-y-5">
        <h2 className="text-base font-semibold">ID slings</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Student slings used", report.studentSlingsUsed],
            ["Employee slings used", report.employeeSlingsUsed],
            ["Sling release records", report.slingReleases.length],
          ].map(([label, value]) => (
            <article key={String(label)} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
              <p className="text-sm text-slate-500">
                {label} · {report.periodLabel}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCount(Number(value))}</p>
            </article>
          ))}
        </div>
        <SimpleTable
          title="Slings by person who released"
          headers={["Released by", "Slings used"]}
          rows={report.slingReleaserRows}
          empty="No sling releases in this period."
        />
        <SimpleTable
          title="ID sling releases"
          headers={["Date", "Name", "ID #", "Category", "OR", "Amount", "Released by", "Sling for", "Slings"]}
          rows={report.slingReleases.map((release) => [
            formatIdDate(release.transactionDate),
            release.personName,
            release.idNumber,
            release.reason,
            release.orNumber || "—",
            formatReleaseAmount(release.amount) || "—",
            release.releasedBy || release.printedBy,
            release.slingKind === "EMPLOYEE" ? "Employee" : "Student",
            release.slingsUsed,
          ])}
          empty="No sling releases in this period."
        />
        <SimpleTable
          title="ID sling stock received"
          headers={["Date", "Item", "Packs", "Units added", "Received from"]}
          rows={report.slingReceipts.map((receipt) => [
            formatIdDate(receipt.dateReceived),
            receiptItemTitle(receipt),
            receipt.packsReceived,
            receipt.unitsAdded,
            receipt.receivedFrom,
          ])}
          empty="No slings received in this period."
        />
      </section>
    </div>
  );
}

function SimpleTable({
  title,
  headers,
  rows,
  empty,
}: {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  empty: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="border-b px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <Table className={headers.length > 6 ? "min-w-[56rem]" : "min-w-[36rem]"}>
        <TableHeader>
          <TableRow>
            {headers.map((heading) => (
              <TableHead key={heading}>{heading}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} className="py-6 text-center text-sm text-slate-500">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={`${title}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={`${headingKey(headers[cellIndex])}-${cellIndex}`} className="tabular-nums">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

function headingKey(heading: string | undefined) {
  return heading ?? "cell";
}
