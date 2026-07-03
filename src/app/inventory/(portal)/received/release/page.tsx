import { ItemReleaseForm } from "@/components/item-release-form";

export default function ReleaseItemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Release Item
        </h1>
        <p className="text-sm text-muted-foreground">
          Record when a consumable item is used — available count on received
          items will decrease
        </p>
      </div>
      <ItemReleaseForm />
    </div>
  );
}
