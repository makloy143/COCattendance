import { IdItemTypeSettings } from "@/components/id-item-type-settings";
import { IdSettingsForm } from "@/components/id-settings-form";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getIdMaintenanceSettings, listIdItemOptions } from "@/lib/id-maintenance-data";

export const dynamic = "force-dynamic";

export default async function IdSettingsPage() {
  await requireInventorySession();
  const [settings, itemTypes] = await Promise.all([
    getIdMaintenanceSettings(),
    listIdItemOptions(),
  ]);

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-slate-600">
        Plain White PVC cards are 250 per box. A box number such as #6/88 starts
        on the first day a card from it is used and ends on the day those cards
        are all out. ID card stock is boxes times cards per box, or one card per
        piece. Sling stock is bundles times slings per bundle, or one sling per
        piece.
        Releases deduct only the cards and slings marked as used. Bad printing
        deducts the wasted quantity on its own.
      </p>
      <IdSettingsForm
        cardsPerBox={settings.cardsPerBox}
        slingsPerBundle={settings.slingsPerBundle}
        lowIdCardThreshold={settings.lowIdCardThreshold}
        lowSlingThreshold={settings.lowSlingThreshold}
      />
      <IdItemTypeSettings
        options={itemTypes.map((option) => ({
          id: option.id,
          name: option.name,
          category: option.category,
          active: option.active,
          receiptCount: option._count.receipts,
        }))}
      />
    </div>
  );
}
