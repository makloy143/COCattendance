import { InkModelSettings } from "@/components/ink-model-settings";
import { InkSettingsForm } from "@/components/ink-settings-form";
import { InventoryDepartmentSettings } from "@/components/inventory-department-settings";
import { requireInventorySession } from "@/lib/inventory-auth";
import { listInventoryDepartments } from "@/lib/inventory-departments";
import { getInkOfficeSettings, listInkModels } from "@/lib/ink-settings";

export const dynamic = "force-dynamic";

export default async function InkSettingsPage() {
  await requireInventorySession();
  const [settings, models, departments] = await Promise.all([
    getInkOfficeSettings(),
    listInkModels(),
    listInventoryDepartments(),
  ]);

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-slate-600">
        Add the ink models used when bottles are received. Each model has its own
        received, released, and remaining count. The low-stock number applies to
        every model.
      </p>
      <InkSettingsForm lowStockAtMost={settings.lowStockAtMost} />
      <InkModelSettings options={models} />
      <InventoryDepartmentSettings departments={departments} />
    </div>
  );
}
