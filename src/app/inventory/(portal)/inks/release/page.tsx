import { ItemReleaseForm } from "@/components/item-release-form";

export default function InkReleasePage() {
  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-slate-600">
        Release bottles from ink stock. This stays in the Ink Office and does not open general inventory.
      </p>
      <ItemReleaseForm
        category="INK"
        afterReleaseHref="/inventory/inks"
        logsHref="/inventory/inks/history"
        cancelHref="/inventory/inks"
        receiveHref="/inventory/inks/inventory"
      />
    </div>
  );
}
