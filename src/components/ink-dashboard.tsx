import { AlertTriangle, CheckCircle2, Droplets, PackagePlus } from "lucide-react";
import { InkReceiveForm } from "@/components/ink-receive-form";
import { InkClearStockButton } from "@/components/ink-stock-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type InkDashboardView, type InkRecordRow } from "@/lib/ink-dashboard";
import { INK_COLOR_BADGE_CLASSES, type InkColor } from "@/lib/inventory";
import { cn } from "@/lib/utils";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
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

export function InkDashboard({
  view,
  periodLabel,
}: {
  view: InkDashboardView;
  periodLabel: string;
}) {
  const cards = [
    {
      title: "Bottles in stock",
      value: formatCount(view.remaining),
      unit: "bottles",
      note: "Current balance",
      icon: Droplets,
      className: "border-[#d7efe0] bg-[#eef8f1]",
      iconClass: "bg-[#0e6b43] text-white",
      alert: view.lowStockCount > 0 ? "Low Stock" : null,
    },
    {
      title: "Ink received",
      value: formatCount(view.received),
      unit: "bottles",
      note: periodLabel,
      icon: PackagePlus,
      className: "border-[#d7efe0] bg-[#f3faf4]",
      iconClass: "bg-[#14875a] text-white",
      alert: null,
    },
    {
      title: "Ink released",
      value: formatCount(view.released),
      unit: "bottles",
      note: periodLabel,
      icon: CheckCircle2,
      className: "border-[#d5e7f5] bg-[#eef6fb]",
      iconClass: "bg-[#2f7eb5] text-white",
      alert: null,
    },
    {
      title: "Low stock",
      value: formatCount(view.lowStockCount),
      unit: "models",
      note: `≤ ${view.lowStockAtMost} bottles`,
      icon: AlertTriangle,
      className: "border-[#f6d4d4] bg-[#fdeeee]",
      iconClass: "bg-[#e15b64] text-white",
      alert: null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className={cn("rounded-xl border px-4 py-3.5 shadow-sm", card.className)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className={cn("flex size-7 items-center justify-center rounded-lg", card.iconClass)}>
                  <card.icon className="size-3.5" />
                </span>
                {card.title}
              </div>
              {card.alert ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  <AlertTriangle className="size-3" />
                  {card.alert}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {card.value}{" "}
              <span className="text-base font-medium text-slate-500">{card.unit}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.85fr)]">
        <section className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3 sm:px-5">
            <h2 className="text-base font-semibold">Inventory overview</h2>
            <p className="text-xs text-slate-500">
              Current balance. Remaining bottles subtract releases. The period filter changes
              received and released activity only.
            </p>
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            {view.models.map((model) => (
              <div key={model.key} className="rounded-xl border bg-[#fbfefc] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <InkBadge name={model.name} inkColor={model.inkColor} />
                    {model.received > 0 && model.balance <= view.lowStockAtMost ? (
                      <span className="text-[11px] font-semibold text-amber-800">Low stock</span>
                    ) : null}
                  </div>
                  {model.balance > 0 ? (
                    <InkClearStockButton
                      modelName={model.name}
                      label="Clear"
                      variant="ghost"
                      confirmMessage={`Clear ${model.balance} available bottle${model.balance === 1 ? "" : "s"} of ${model.name}? Released bottles stay in history.`}
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <Figure value={model.received} label="Received" tone="green" />
                  <span className="pb-4 text-xl text-slate-400">−</span>
                  <Figure value={model.released} label="Released" tone="blue" />
                  <span className="pb-4 text-xl text-slate-400">=</span>
                  <Figure value={model.balance} label="Remaining" tone="green" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <InkReceiveForm models={view.catalog} />
      </div>

      <InkRecordTable title="Receiving records" rows={view.receipts} personHeading="Received by" />
      <InkRecordTable title="Release records" rows={view.releases} personHeading="Released to" />
    </div>
  );
}

function Figure({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "green" | "blue";
}) {
  return (
    <div className="min-w-[4.5rem] text-center">
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "green" ? "text-[#0e6b43]" : "text-[#2f7eb5]"
        )}
      >
        {formatCount(value)}
      </p>
      <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</p>
    </div>
  );
}

export function InkRecordTable({
  title,
  rows,
  personHeading,
  removable = false,
}: {
  title: string;
  rows: InkRecordRow[];
  personHeading: string;
  removable?: boolean;
}) {
  const columns = removable
    ? ["Date", "Ink model", "Qty", "Available", personHeading, "Department", ""]
    : ["Date", "Ink model", "Qty", personHeading, "Department"];

  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((heading) => (
              <TableHead key={heading || "actions"}>{heading}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-slate-500">
                Nothing in this period.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.dateLabel}</TableCell>
                <TableCell>
                  <InkBadge name={row.model} inkColor={row.inkColor} />
                </TableCell>
                <TableCell className="tabular-nums">{formatCount(row.quantity)}</TableCell>
                {removable ? (
                  <TableCell className="tabular-nums">{formatCount(row.available ?? 0)}</TableCell>
                ) : null}
                <TableCell>{row.person}</TableCell>
                <TableCell>{row.department}</TableCell>
                {removable ? (
                  <TableCell>
                    {(row.available ?? 0) > 0 ? (
                      <InkClearStockButton
                        endpoint={`/api/inventory/inks/stock/${row.id}`}
                        label="Remove"
                        variant="ghost"
                        confirmMessage={`Remove ${row.available} available bottle${row.available === 1 ? "" : "s"} of ${row.model}? Released bottles stay in history.`}
                      />
                    ) : (
                      <span className="text-xs text-slate-400">None left</span>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}
