import Link from "next/link";
import { AlertTriangle, Boxes, Droplets, PackagePlus, TrendingUp } from "lucide-react";
import { InkDistributionChart, InkTrendChart } from "@/components/ink-dashboard-charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INK_LOW_STOCK_AT_MOST, type InkDashboardView } from "@/lib/ink-dashboard";
import { INK_COLOR_BADGE_CLASSES, type InkColor } from "@/lib/inventory";
import { cn } from "@/lib/utils";

function formatChange(value: number | null) {
  if (value === null) return "No earlier period to compare";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}% vs previous period`;
}

function InkBadge({ name, inkColor }: { name: string; inkColor: InkColor | null }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-semibold",
        inkColor ? INK_COLOR_BADGE_CLASSES[inkColor] : "bg-slate-200 text-slate-700"
      )}
    >
      {name}
    </span>
  );
}

export function InkDashboard({ view }: { view: InkDashboardView }) {
  const stocked = view.models.filter((model) => model.balance > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#2563eb]">
            <Droplets className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Ink Inventory Dashboard
            </h1>
            <p className="text-sm text-slate-500">Receiving, release, and current stock monitoring</p>
          </div>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-xs text-slate-500">
            From
            <input
              type="date"
              name="from"
              defaultValue={view.from}
              className="block h-9 rounded-md border bg-white px-2 text-sm text-slate-800"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-500">
            To
            <input
              type="date"
              name="to"
              defaultValue={view.to}
              className="block h-9 rounded-md border bg-white px-2 text-sm text-slate-800"
            />
          </label>
          <button type="submit" className="h-9 rounded-md bg-[#2563eb] px-3 text-sm font-medium text-white">
            Apply
          </button>
        </form>
      </div>
      <p className="text-xs text-slate-500">
        Received and released follow this date range. Stock remaining is the current balance:
        bottles received minus bottles still released.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          title="Total ink received"
          value={view.received}
          unit="bottles"
          note={formatChange(view.receivedChange)}
          icon={PackagePlus}
          className="border-blue-100 bg-blue-50"
          iconClass="bg-blue-500"
        />
        <Kpi
          title="Total ink released"
          value={view.released}
          unit="bottles"
          note={formatChange(view.releasedChange)}
          icon={TrendingUp}
          className="border-emerald-100 bg-emerald-50"
          iconClass="bg-emerald-500"
        />
        <Kpi
          title="Current stock remaining"
          value={view.remaining}
          unit="bottles"
          note="Current balance"
          icon={Boxes}
          className="border-amber-100 bg-amber-50"
          iconClass="bg-amber-400"
        />
        <Kpi
          title="Low stock items"
          value={view.lowStockCount}
          unit="items"
          note={`≤ ${INK_LOW_STOCK_AT_MOST} bottles remaining`}
          icon={AlertTriangle}
          className="border-red-100 bg-red-50"
          iconClass="bg-red-500"
        />
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Received vs released</h2>
          <p className="text-xs text-slate-500">
            <span className="mr-3 inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-blue-500" /> Received</span>
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-emerald-500" /> Released</span>
          </p>
        </div>
        <InkTrendChart points={view.trend} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="space-y-4">
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Stock by ink model</h2>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
              <InkDistributionChart
                total={view.remaining}
                slices={stocked.map((model) => ({
                  name: model.name,
                  value: model.balance,
                  inkColor: model.inkColor,
                }))}
              />
              <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
                {stocked.length === 0 ? (
                  <li className="text-slate-500">No bottles in stock.</li>
                ) : (
                  stocked.map((model) => (
                    <li key={model.key} className="flex items-center justify-between gap-3">
                      <InkBadge name={model.name} inkColor={model.inkColor} />
                      <span className="tabular-nums font-medium">{model.balance}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-red-50 px-4 py-3 text-red-700">
              <AlertTriangle className="size-4" />
              <h2 className="text-sm font-semibold">Low stock alert</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ink model</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.lowStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-6 text-center text-sm text-slate-500">
                      No received ink is at or below {INK_LOW_STOCK_AT_MOST} bottles.
                    </TableCell>
                  </TableRow>
                ) : (
                  view.lowStock.map((model) => (
                    <TableRow key={model.name}>
                      <TableCell>
                        <InkBadge name={model.name} inkColor={model.inkColor} />
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-red-600">
                        {model.balance}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>
        </div>

        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Current stock by ink model</h2>
          <p className="mt-1 text-xs text-slate-500">Received − released = balance. These totals are all-time.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {view.models.map((model) => (
              <article key={model.key} className="overflow-hidden rounded-lg border">
                <div
                  className={cn(
                    "px-3 py-2 text-sm font-semibold",
                    model.inkColor ? INK_COLOR_BADGE_CLASSES[model.inkColor] : "bg-slate-200"
                  )}
                >
                  {model.name}
                </div>
                <dl className="grid grid-cols-3 gap-2 px-3 py-2 text-center text-xs">
                  <div>
                    <dt className="text-slate-500">Received</dt>
                    <dd className="text-base font-semibold tabular-nums">{model.received}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Released</dt>
                    <dd className="text-base font-semibold tabular-nums">{model.released}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Balance</dt>
                    <dd className="text-base font-semibold tabular-nums">{model.balance}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecordTable
          title="Receiving records"
          href="/inventory/received"
          tone="blue"
          rows={view.receipts}
          dateHeading="Date received"
          personHeading="Received by"
        />
        <RecordTable
          title="Release records"
          href="/inventory/releases"
          tone="green"
          rows={view.releases}
          dateHeading="Date released"
          personHeading="Released to"
        />
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  unit,
  note,
  icon: Icon,
  className,
  iconClass,
}: {
  title: string;
  value: number;
  unit: string;
  note: string;
  icon: typeof Droplets;
  className: string;
  iconClass: string;
}) {
  return (
    <article className={cn("rounded-xl border px-4 py-3.5 shadow-sm", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <span className={cn("flex size-7 items-center justify-center rounded-full text-white", iconClass)}>
          <Icon className="size-3.5" />
        </span>
        {title}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value} <span className="text-base font-medium text-slate-500">{unit}</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </article>
  );
}

function RecordTable({
  title,
  href,
  tone,
  rows,
  dateHeading,
  personHeading,
}: {
  title: string;
  href: string;
  tone: "blue" | "green";
  rows: InkDashboardView["receipts"];
  dateHeading: string;
  personHeading: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 text-white",
          tone === "blue" ? "bg-[#3b82f6]" : "bg-[#22c55e]"
        )}
      >
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href={href} className="text-xs font-medium underline-offset-2 hover:underline">
          View all
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {tone === "green" ? (
              <>
                <TableHead>{dateHeading}</TableHead>
                <TableHead>{personHeading}</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Ink model</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </>
            ) : (
              <>
                <TableHead>Ink model</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>{dateHeading}</TableHead>
                <TableHead>{personHeading}</TableHead>
                <TableHead>Department</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                Nothing in this date range.
              </TableCell>
            </TableRow>
          ) : tone === "green" ? (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.dateLabel}</TableCell>
                <TableCell>{row.person}</TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>
                  <InkBadge name={row.model} inkColor={row.inkColor} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
              </TableRow>
            ))
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <InkBadge name={row.model} inkColor={row.inkColor} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
                <TableCell>{row.dateLabel}</TableCell>
                <TableCell>{row.person}</TableCell>
                <TableCell>{row.department}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}
