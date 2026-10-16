import { ItemReleaseForm } from "@/components/item-release-form";
import { InkRecordTable } from "@/components/ink-dashboard";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getInkDashboard } from "@/lib/ink-dashboard-data";

export const dynamic = "force-dynamic";

export default async function InkReleasePage() {
  await requireInventorySession();
  const view = await getInkDashboard("all", 200);

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-slate-600">
        Release bottles from ink stock. Removing an ink also removes its quantity from this page.
      </p>
      <ItemReleaseForm
        category="INK"
        afterReleaseHref="/inventory/inks"
        logsHref="/inventory/inks/history"
        cancelHref="/inventory/inks"
        receiveHref="/inventory/inks/inventory"
      />
      <InkRecordTable
        title="Release records"
        rows={view.releases}
        personHeading="Released to"
        releaseRemovable
      />
    </div>
  );
}
