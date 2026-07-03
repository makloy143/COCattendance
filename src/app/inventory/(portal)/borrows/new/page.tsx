import { BorrowItemForm } from "@/components/borrow-item-form";

export default function NewBorrowPage() {
  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Borrow Item
          </h1>
          <p className="text-sm text-muted-foreground">
            Record equipment borrowed from inventory
          </p>
      </div>
      <BorrowItemForm />
    </div>
  );
}
