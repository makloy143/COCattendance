import { ItemReleaseForm } from "@/components/item-release-form";

export default function InkReleasePage() {
  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-slate-600">
        Releasing ink drops that model&apos;s remaining bottles. The dashboard balance
        stays the current stock, not the period filter.
      </p>
      <ItemReleaseForm />
    </div>
  );
}
