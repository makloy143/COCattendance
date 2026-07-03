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
  getItemCategoryLabel,
  type ItemCategory,
} from "@/lib/inventory";
import type { BorrowRecordFormValues } from "@/lib/validations";

type AvailableItem = {
  id: string;
  itemName: string;
  category: ItemCategory;
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

export function ItemReleaseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [values, setValues] = useState<BorrowRecordFormValues>(emptyValues);

  useEffect(() => {
    async function loadItems() {
      setItemsLoading(true);
      const response = await fetch(
        "/api/inventory/received?availableOnly=true&itemType=CONSUMABLE"
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
    setLoading(true);

    try {
      const response = await fetch("/api/inventory/borrows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          signatureConfirmed: true,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to release item");
        return;
      }

      toast.success("Item released");
      router.push("/inventory/received");
      router.refresh();
    } catch {
      toast.error("Failed to release item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle>Release item</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="receivedItemId">Item</Label>
            {itemsLoading ? (
              <p className="text-sm text-muted-foreground">Loading items...</p>
            ) : availableItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No items in stock. Log a received item first.
              </p>
            ) : (
              <Select
                value={values.receivedItemId}
                onValueChange={(value) => {
                  if (value) updateField("receivedItemId", value);
                }}
              >
                <SelectTrigger id="receivedItemId" className="w-full">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      [{getItemCategoryLabel(item.category)}]{" "}
                      {formatItemDescription(item)} ({item.availableQuantity}{" "}
                      available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="borrowerName">Used by</Label>
            <Input
              id="borrowerName"
              value={values.borrowerName}
              onChange={(e) => updateField("borrowerName", e.target.value)}
              placeholder="Who used the item"
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
            <Label htmlFor="quantityBorrowed">Quantity</Label>
            <Input
              id="quantityBorrowed"
              type="number"
              min={1}
              max={selectedItem?.availableQuantity ?? undefined}
              value={values.quantityBorrowed}
              onChange={(e) =>
                updateField("quantityBorrowed", Number(e.target.value) || 1)
              }
              required
            />
            {selectedItem && (
              <p className="text-xs text-muted-foreground">
                Up to {selectedItem.availableQuantity} available
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateBorrowed">Date used</Label>
            <Input
              id="dateBorrowed"
              type="date"
              value={values.dateBorrowed}
              onChange={(e) => updateField("dateBorrowed", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeBorrowed">Time used</Label>
            <Input
              id="timeBorrowed"
              type="time"
              value={values.timeBorrowed}
              onChange={(e) => updateField("timeBorrowed", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={values.notes ?? ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Purpose, batch, or other details"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={loading || itemsLoading || availableItems.length === 0}
        >
          {loading ? "Saving..." : "Release item"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/inventory/received")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
