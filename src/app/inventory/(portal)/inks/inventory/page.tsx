import { InkReceiveForm } from "@/components/ink-receive-form";
import { InkRecordTable } from "@/components/ink-dashboard";
import { InkClearStockButton } from "@/components/ink-stock-actions";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getInkDashboard } from "@/lib/ink-dashboard-data";

export const dynamic = "force-dynamic";

export default async function InkInventoryPage() {
  await requireInventorySession();
  const view = await getInkDashboard("all", 200);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Ink inventory</h2>
            <p className="mt-1 text-sm text-slate-600">
              Remaining bottles are the current balance. Clear or remove deletes the available bottles and their release quantity.
            </p>
          </div>
          {view.remaining > 0 ? (
            <InkClearStockButton
              label="Clear available stock"
              confirmMessage={`Clear all ${view.remaining} available ink bottles? This also removes their release quantity.`}
            />
          ) : null}
        </div>
        <p className="mt-3 text-sm text-slate-700">
          Remaining <strong className="tabular-nums">{view.remaining}</strong> = {view.models.reduce((sum, model) => sum + model.received, 0)} received − {view.models.reduce((sum, model) => sum + model.released, 0)} released
        </p>
      </section>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <InkRecordTable title="Bottles received" rows={view.receipts} personHeading="Received by" removable />
        <InkReceiveForm models={view.catalog} />
      </div>
    </div>
  );
}
