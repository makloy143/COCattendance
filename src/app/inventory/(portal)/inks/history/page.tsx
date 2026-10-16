import { InkRecordTable } from "@/components/ink-dashboard";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getInkDashboard } from "@/lib/ink-dashboard-data";

export const dynamic = "force-dynamic";

export default async function InkHistoryPage() {
  await requireInventorySession();
  const view = await getInkDashboard("all", 200);

  return (
    <div className="space-y-4">
      <InkRecordTable title="Receiving records" rows={view.receipts} personHeading="Received by" />
      <InkRecordTable title="Release records" rows={view.releases} personHeading="Released to" releaseRemovable />
    </div>
  );
}
