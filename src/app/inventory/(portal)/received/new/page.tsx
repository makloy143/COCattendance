import { ReceivedItemForm } from "@/components/received-item-form";

export default function NewReceivedItemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Log Received Item
        </h1>
        <p className="text-sm text-muted-foreground">
          Record items received from COC Main with sender and item details
        </p>
      </div>
      <ReceivedItemForm />
    </div>
  );
}
