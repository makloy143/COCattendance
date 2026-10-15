import { IdSettingsForm } from "@/components/id-settings-form";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getIdMaintenanceSettings } from "@/lib/id-maintenance-data";

export const dynamic = "force-dynamic";

export default async function IdSettingsPage() {
  await requireInventorySession();
  const settings = await getIdMaintenanceSettings();

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-slate-600">
        ID card stock is boxes times cards per box. Sling stock is bundles times
        slings per bundle. Releases deduct only the cards and slings marked as
        used. Bad printing deducts the wasted quantity on its own.
      </p>
      <IdSettingsForm
        cardsPerBox={settings.cardsPerBox}
        slingsPerBundle={settings.slingsPerBundle}
        lowIdCardThreshold={settings.lowIdCardThreshold}
        lowSlingThreshold={settings.lowSlingThreshold}
      />
    </div>
  );
}
