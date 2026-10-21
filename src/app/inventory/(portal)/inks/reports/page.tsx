import { ReportExcelButton } from "@/components/report-excel-button";
import { InkRecordTable } from "@/components/ink-dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireInventorySession } from "@/lib/inventory-auth";
import { ID_PERIOD_LABELS, formatCount, parseIdPeriod } from "@/lib/id-maintenance";
import { getInkDashboard } from "@/lib/ink-dashboard-data";
import { INK_COLOR_LABELS } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function InkReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const period = parseIdPeriod(params.period);
  const view = await getInkDashboard(period, 1000);
  const periodLabel = ID_PERIOD_LABELS[period];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Ink stock and activity for {periodLabel}. Remaining bottles are the current balance.
        </p>
        <ReportExcelButton endpoint="/api/inventory/inks/report" period={period} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Bottles received", view.received],
          ["Bottles released", view.released],
          ["Bottles remaining", view.remaining],
          ["Low stock models", view.lowStockCount],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
              {label}
              {label === "Bottles remaining" || label === "Low stock models" ? "" : ` · ${periodLabel}`}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCount(Number(value))}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Stock by model</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {["Ink model", "Color", "Received", "Released", "Remaining"].map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.models.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                  No ink models yet.
                </TableCell>
              </TableRow>
            ) : (
              view.models.map((model) => (
                <TableRow key={model.key}>
                  <TableCell>{model.name}</TableCell>
                  <TableCell>{model.inkColor ? INK_COLOR_LABELS[model.inkColor] : "—"}</TableCell>
                  <TableCell className="tabular-nums">{formatCount(model.received)}</TableCell>
                  <TableCell className="tabular-nums">{formatCount(model.released)}</TableCell>
                  <TableCell className="tabular-nums">{formatCount(model.balance)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <InkRecordTable title="Receiving records" rows={view.receipts} personHeading="Received by" />
      <InkRecordTable title="Release records" rows={view.releases} personHeading="Released to" />
    </div>
  );
}
