"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DepartmentSelect } from "@/components/department-select";
import {
  formatItemDescription,
  getCurrentTimeString,
  type ItemType,
} from "@/lib/inventory";
import type { BorrowRecordFormValues } from "@/lib/validations";

type AvailableItem = {
  id: string;
  itemName: string;
  itemType: ItemType;
  brand: string | null;
  model: string | null;
  color: string | null;
  serialNumber: string | null;
  quantity: number;
  availableQuantity: number;
};

const emptyValues: BorrowRecordFormValues = {
  receivedItemId: "",
  borrowerName: "",
  department: "",
  quantityBorrowed: 1,
  dateBorrowed: format(new Date(), "yyyy-MM-dd"),
  timeBorrowed: getCurrentTimeString(),
  dueDate: "",
  signatureConfirmed: false,
  notes: "",
};

export function BorrowItemForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [values, setValues] = useState<BorrowRecordFormValues>(emptyValues);

  useEffect(() => {
    async function loadItems() {
      setItemsLoading(true);
      const response = await fetch(
        "/api/inventory/received?availableOnly=true&itemType=EQUIPMENT"
      );
      const data = await response.json();
      setAvailableItems(data);
      setItemsLoading(false);
    }

    loadItems();
  }, []);

  const selectedItem = availableItems.find(
    (item) => item.id === values.receivedItemId
  );

  function updateField<K extends keyof BorrowRecordFormValues>(
    field: K,
    value: BorrowRecordFormValues[K]
  ) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "receivedItemId") {
        next.quantityBorrowed = 1;
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!values.signatureConfirmed) {
      toast.error("Please confirm the borrow signature");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/inventory/borrows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to create borrow record");
        return;
      }

      toast.success("Equipment borrowed");
      router.push("/inventory/borrows");
      router.refresh();
    } catch {
      toast.error("Failed to create borrow record");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle>Borrow details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="receivedItemId">Equipment</Label>
            {itemsLoading ? (
              <p className="text-sm text-muted-foreground">Loading equipment...</p>
            ) : availableItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No equipment available to borrow. Log a received item first.
              </p>
            ) : (
              <Select
                value={values.receivedItemId}
                onValueChange={(value) => {
                  if (value) updateField("receivedItemId", value);
                }}
              >
                <SelectTrigger id="receivedItemId" className="w-full">
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {formatItemDescription(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedItem?.serialNumber && (
              <p className="text-xs text-muted-foreground">
                Serial: {selectedItem.serialNumber}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="borrowerName">Borrower name</Label>
            <Input
              id="borrowerName"
              value={values.borrowerName}
              onChange={(e) => updateField("borrowerName", e.target.value)}
              placeholder="Who is borrowing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <DepartmentSelect
              id="department"
              value={values.department}
              onValueChange={(v) => updateField("department", v)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateBorrowed">Date borrowed</Label>
            <Input
              id="dateBorrowed"
              type="date"
              value={values.dateBorrowed}
              onChange={(e) => updateField("dateBorrowed", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeBorrowed">Time borrowed</Label>
            <Input
              id="timeBorrowed"
              type="time"
              value={values.timeBorrowed}
              onChange={(e) => updateField("timeBorrowed", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="dueDate">Due date (optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={values.dueDate}
              onChange={(e) => updateField("dueDate", e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Optional remarks"
              rows={3}
            />
          </div>

          <div className="flex items-start gap-3 sm:col-span-2">
            <input
              id="signatureConfirmed"
              type="checkbox"
              checked={values.signatureConfirmed}
              onChange={(e) =>
                updateField("signatureConfirmed", e.target.checked)
              }
              className="mt-1 size-4 rounded border-input"
            />
            <Label htmlFor="signatureConfirmed" className="font-normal leading-snug">
              I confirm this borrow — borrower acknowledges receipt of the
              equipment listed above.
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={loading || itemsLoading || availableItems.length === 0}
        >
          {loading ? "Saving..." : "Create borrow record"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/inventory/borrows")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
