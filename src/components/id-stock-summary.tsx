import { AlertTriangle, CheckCircle2, IdCard, Link2 } from "lucide-react";
import { formatCount, type IdPeriodActivity, type IdStockView } from "@/lib/id-maintenance";
import { cn } from "@/lib/utils";

export function IdKpiGrid({
  stock,
  activity,
  periodLabel,
}: {
  stock: IdStockView;
  activity: IdPeriodActivity;
  periodLabel: string;
}) {
  const cards = [
    {
      title: "ID Cards in Stock",
      value: formatCount(stock.cardsRemaining),
      unit: "cards",
      note: "Current balance",
      icon: IdCard,
      className: "border-[#d7efe0] bg-[#eef8f1]",
      iconClass: "bg-[#0e6b43] text-white",
      alert: stock.lowCards ? "Low Stock" : null,
    },
    {
      title: "Sling in Stock",
      value: formatCount(stock.slingsRemaining),
      unit: "pcs",
      note: "Current balance",
      icon: Link2,
      className: "border-[#d7efe0] bg-[#f3faf4]",
      iconClass: "bg-[#14875a] text-white",
      alert: stock.lowSlings ? "Low Stock" : null,
    },
    {
      title: "IDs Released",
      value: formatCount(activity.cardsReleased),
      unit: "",
      note: periodLabel,
      icon: CheckCircle2,
      className: "border-[#d5e7f5] bg-[#eef6fb]",
      iconClass: "bg-[#2f7eb5] text-white",
      alert: null,
    },
    {
      title: "Bad Printing",
      value: formatCount(activity.cardsWasted),
      unit: "cards",
      note: periodLabel,
      icon: AlertTriangle,
      className: "border-[#f6d4d4] bg-[#fdeeee]",
      iconClass: "bg-[#e15b64] text-white",
      alert: null,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.title}
          className={cn("rounded-xl border px-4 py-3.5 shadow-sm", card.className)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg",
                  card.iconClass
                )}
              >
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
            {card.unit ? (
              <span className="text-base font-medium text-slate-500">{card.unit}</span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-slate-500">{card.note}</p>
        </article>
      ))}
    </div>
  );
}

function EquationFigure({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "green" | "blue" | "red";
}) {
  return (
    <div className="min-w-[4.5rem] text-center">
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "green" && "text-[#0e6b43]",
          tone === "blue" && "text-[#2f7eb5]",
          tone === "red" && "text-[#d4535c]"
        )}
      >
        {formatCount(value)}
      </p>
      <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</p>
    </div>
  );
}

export function IdInventoryOverview({ stock }: { stock: IdStockView }) {
  return (
    <section className="rounded-xl border bg-white shadow-sm">
      <div className="border-b px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold">Inventory Overview</h2>
        <p className="text-xs text-slate-500">
          Current balance. Remaining cards subtract releases and wasted cards, then add
          cards surrendered on withdrawal. Remaining slings subtract slings used and
          add student slings turned in.
        </p>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="rounded-xl border bg-[#fbfefc] p-4">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#0e6b43] text-white">
              <IdCard className="size-4" />
            </span>
            <div>
              <p className="font-medium">{stock.cardItemName}</p>
              <p className="text-xs text-slate-500">{stock.cardPackNote}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <EquationFigure value={stock.cardsReceived} label="Received" tone="green" />
            <span className="pb-4 text-xl text-slate-400">−</span>
            <EquationFigure value={stock.cardsReleased} label="Released" tone="blue" />
            <span className="pb-4 text-xl text-slate-400">−</span>
            <EquationFigure value={stock.cardsWasted} label="Bad-print" tone="red" />
            <span className="pb-4 text-xl text-slate-400">+</span>
            <EquationFigure value={stock.cardsSurrendered} label="Returned" tone="green" />
            <span className="pb-4 text-xl text-slate-400">=</span>
            <EquationFigure value={stock.cardsRemaining} label="Remaining" tone="green" />
          </div>
        </div>

        <div className="rounded-xl border bg-[#fbfefc] p-4">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#14875a] text-white">
              <Link2 className="size-4" />
            </span>
            <div>
              <p className="font-medium">Sling Stock</p>
              <p className="text-xs text-slate-500">{stock.slingPackNote}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <EquationFigure value={stock.slingsReceived} label="Received" tone="green" />
            <span className="pb-4 text-xl text-slate-400">−</span>
            <EquationFigure value={stock.slingsUsed} label="Used" tone="blue" />
            <span className="pb-4 text-xl text-slate-400">+</span>
            <EquationFigure value={stock.studentSlingsSurrendered} label="Returned" tone="green" />
            <span className="pb-4 text-xl text-slate-400">=</span>
            <EquationFigure value={stock.slingsRemaining} label="Remaining" tone="green" />
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              Student remaining{" "}
              <strong className="tabular-nums">{formatCount(stock.studentSlingsRemaining)}</strong>
              <span className="text-slate-500">
                {" "}
                ({formatCount(stock.studentSlingsReceived)} received −{" "}
                {formatCount(stock.studentSlingsUsed)} used +{" "}
                {formatCount(stock.studentSlingsSurrendered)} returned)
              </span>
            </p>
            <p>
              Employee remaining{" "}
              <strong className="tabular-nums">{formatCount(stock.employeeSlingsRemaining)}</strong>
              <span className="text-slate-500">
                {" "}
                ({formatCount(stock.employeeSlingsReceived)} received −{" "}
                {formatCount(stock.employeeSlingsUsed)} used)
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-[#fbfefc] p-4">
          <p className="font-medium">Printer supplies</p>
          <p className="mt-1 text-xs text-slate-500">
            Pieces on hand. These do not change ID card or sling remaining.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {stock.supplyPieces.length === 0 ? (
              <p className="text-sm text-slate-500">No piece-only item types yet.</p>
            ) : (
              stock.supplyPieces.map((supply) => (
                <p key={supply.id} className="text-sm text-slate-700">
                  {supply.name}{" "}
                  <strong className="tabular-nums">{formatCount(supply.pieces)}</strong>
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
