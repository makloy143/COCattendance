"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type InkColor,
} from "@/lib/inventory";
import type { BorrowRecordFormValues } from "@/lib/validations";

type AvailableInkItem = {
  id: string;
  itemName: string;
  inkColor: InkColor | null;
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

export function InkReleaseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [availableItems, setAvailableItems] = useState<AvailableInkItem[]>([]);
  const [values, setValues] = useState<BorrowRecordFormValues>(emptyValues);

  useEffect(() => {
    async function loadItems() {
      setItemsLoading(true);
      const response = await fetch(
        "/api/inventory/received?availableOnly=true&category=INK"
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
    setValues((current) => ({ ...current, [field]: value }));
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
        toast.error(data.error ?? "Failed to release ink");
        return;
      }

      toast.success("Ink released");
      router.push("/inventory/inks");
      router.refresh();
    } catch {
      toast.error("Failed to release ink");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card className="border-l-4 border-l-cyan-500">
        <CardHeader>
          <CardTitle>Release ink</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="receivedItemId">Ink model</Label>
            {itemsLoading ? (
              <p className="text-sm text-muted-foreground">Loading inks...</p>
            ) : availableItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No ink in stock. Receive ink first.
              </p>
            ) : (
              <Select
                value={values.receivedItemId}
                onValueChange={(value) => {
                  if (value) updateField("receivedItemId", value);
                }}
              >
                <SelectTrigger id="receivedItemId" className="w-full">
                  <SelectValue placeholder="Select ink" />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {formatItemDescription(item)} ({item.availableQuantity}{" "}
                      available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="borrowerName">Received by</Label>
            <Input
              id="borrowerName"
              value={values.borrowerName}
              onChange={(e) => updateField("borrowerName", e.target.value)}
              placeholder="Who is receiving the ink"
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
            <Label htmlFor="dateBorrowed">Date release</Label>
            <Input
              id="dateBorrowed"
              type="date"
              value={values.dateBorrowed}
              onChange={(e) => updateField("dateBorrowed", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeBorrowed">Time release</Label>
            <Input
              id="timeBorrowed"
              type="time"
              value={values.timeBorrowed}
              onChange={(e) => updateField("timeBorrowed", e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={loading || itemsLoading || availableItems.length === 0}
        >
          {loading ? "Saving..." : "Release ink"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/inventory/inks")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
