"use client";

import { useState } from "react";
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
  ITEM_TYPES,
  ITEM_TYPE_LABELS,
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
  INK_COLORS,
  INK_COLOR_LABELS,
  INK_MODEL_PRESETS,
  type ItemCategory,
  type InkColor,
} from "@/lib/inventory";
import type { ReceivedItemFormValues } from "@/lib/validations";

const emptyValues: ReceivedItemFormValues = {
  itemName: "",
  itemType: "CONSUMABLE",
  category: "GENERAL",
  inkColor: "",
  brand: "",
  model: "",
  color: "",
  serialNumber: "",
  quantity: 1,
  senderName: "",
  senderSource: "COC Main",
  receivedByDepartment: "IT- MAIN SCHOOL",
  dateReceived: format(new Date(), "yyyy-MM-dd"),
  notes: "",
};

type ReceivedItemFormProps = {
  defaultCategory?: ItemCategory;
};

export function ReceivedItemForm({
  defaultCategory = "GENERAL",
}: ReceivedItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<ReceivedItemFormValues>({
    ...emptyValues,
    category: defaultCategory,
    itemType: defaultCategory === "INK" ? "CONSUMABLE" : "CONSUMABLE",
  });

  function updateField<K extends keyof ReceivedItemFormValues>(
    field: K,
    value: ReceivedItemFormValues[K]
  ) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "itemType") {
        if (value === "EQUIPMENT") {
          next.quantity = 1;
          next.category = "GENERAL";
        }
      }
      if (field === "category") {
        if (value === "INK") {
          next.itemType = "CONSUMABLE";
        }
        if (value === "ID_SUPPLIES") {
          next.itemType = "CONSUMABLE";
        }
      }
      if (field === "inkColor" && value && value !== "") {
        const presets = INK_MODEL_PRESETS[value as InkColor];
        if (presets?.[0] && !next.itemName) {
          next.itemName = presets[0];
        }
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/inventory/received", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to save received item");
        return;
      }

      toast.success("Item received and logged");
      router.push("/inventory/received");
      router.refresh();
    } catch {
      toast.error("Failed to save received item");
    } finally {
      setLoading(false);
    }
  }

  const isEquipment = values.itemType === "EQUIPMENT";
  const isInk = values.category === "INK";
  const cancelHref = "/inventory/received";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle>Item details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={values.category}
              onValueChange={(value) => {
                if (
                  value === "GENERAL" ||
                  value === "INK" ||
                  value === "ID_SUPPLIES"
                ) {
                  updateField("category", value);
                }
              }}
              disabled={defaultCategory === "INK"}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {ITEM_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemType">Item type</Label>
            <Select
              value={values.itemType}
              onValueChange={(value) => {
                if (value === "CONSUMABLE" || value === "EQUIPMENT") {
                  updateField("itemType", value);
                }
              }}
              disabled={isInk || values.category === "ID_SUPPLIES"}
            >
              <SelectTrigger id="itemType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ITEM_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isInk && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="inkColor">Ink color</Label>
              <Select
                value={values.inkColor || ""}
                onValueChange={(value) => {
                  if (INK_COLORS.includes(value as InkColor)) {
                    updateField("inkColor", value as InkColor);
                  }
                }}
              >
                <SelectTrigger id="inkColor" className="w-full">
                  <SelectValue placeholder="Select ink color" />
                </SelectTrigger>
                <SelectContent>
                  {INK_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {INK_COLOR_LABELS[color]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="itemName">{isInk ? "Ink model" : "Item name"}</Label>
            <Input
              id="itemName"
              value={values.itemName}
              onChange={(e) => updateField("itemName", e.target.value)}
              placeholder={isInk ? "e.g. BK 664" : "e.g. RJ45, AP ARUBA"}
              required
            />
            {isInk && values.inkColor && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {INK_MODEL_PRESETS[values.inkColor as InkColor]?.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="rounded-md border px-2 py-0.5 text-xs hover:bg-muted"
                    onClick={() => updateField("itemName", preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={values.quantity}
              onChange={(e) =>
                updateField("quantity", Number(e.target.value) || 1)
              }
              disabled={isEquipment}
              required
            />
          </div>

          {!isInk && (
            <>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={values.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                  placeholder="e.g. Epson"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model / SKU</Label>
                <Input
                  id="model"
                  value={values.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  placeholder="e.g. T664"
                />
              </div>
            </>
          )}

          {isInk && (
            <div className="space-y-2">
              <Label htmlFor="model">Model code</Label>
              <Input
                id="model"
                value={values.model}
                onChange={(e) => updateField("model", e.target.value)}
                placeholder="Optional model code"
              />
            </div>
          )}

          {!isInk && (
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={values.color}
                onChange={(e) => updateField("color", e.target.value)}
                placeholder="e.g. Black"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="serialNumber">
              Serial number{isEquipment ? " *" : ""}
            </Label>
            <Input
              id="serialNumber"
              value={values.serialNumber}
              onChange={(e) => updateField("serialNumber", e.target.value)}
              placeholder={isEquipment ? "Required for equipment" : "Optional"}
              required={isEquipment}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-emerald-500/60">
        <CardHeader>
          <CardTitle>Receipt details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="senderName">Received by</Label>
            <Input
              id="senderName"
              value={values.senderName}
              onChange={(e) => updateField("senderName", e.target.value)}
              placeholder="Staff who received the item"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receivedByDepartment">Department</Label>
            <DepartmentSelect
              id="receivedByDepartment"
              value={values.receivedByDepartment}
              onValueChange={(v) => updateField("receivedByDepartment", v)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderSource">Sender source</Label>
            <Input
              id="senderSource"
              value={values.senderSource}
              onChange={(e) => updateField("senderSource", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateReceived">Date received</Label>
            <Input
              id="dateReceived"
              type="date"
              value={values.dateReceived}
              onChange={(e) => updateField("dateReceived", e.target.value)}
              required
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
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Log received item"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
