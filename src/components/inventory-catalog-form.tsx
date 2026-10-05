"use client";

import { useState } from "react";
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
import {
  ITEM_TYPES,
  ITEM_TYPE_LABELS,
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
  INK_COLORS,
  INK_COLOR_LABELS,
  type InventoryCatalogItem,
  type InkColor,
} from "@/lib/inventory";
import type { InventoryCatalogItemFormValues } from "@/lib/validations";

const emptyValues: InventoryCatalogItemFormValues = {
  itemName: "",
  itemType: "CONSUMABLE",
  category: "GENERAL",
  inkColor: "",
  brand: "",
  model: "",
  color: "",
  notes: "",
};

function toFormValues(
  item?: InventoryCatalogItem | null
): InventoryCatalogItemFormValues {
  if (!item) return emptyValues;
  return {
    itemName: item.itemName,
    itemType: item.itemType,
    category: item.category,
    inkColor: item.inkColor ?? "",
    brand: item.brand ?? "",
    model: item.model ?? "",
    color: item.color ?? "",
    notes: item.notes ?? "",
  };
}

type InventoryCatalogFormProps = {
  item?: InventoryCatalogItem | null;
  onSaved: (item: InventoryCatalogItem) => void;
  onCancel?: () => void;
};

export function InventoryCatalogForm({
  item,
  onSaved,
  onCancel,
}: InventoryCatalogFormProps) {
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<InventoryCatalogItemFormValues>(
    toFormValues(item)
  );

  const editingId = item?.id;
  const isInk = values.category === "INK";

  function updateField<K extends keyof InventoryCatalogItemFormValues>(
    field: K,
    value: InventoryCatalogItemFormValues[K]
  ) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "category") {
        if (value === "INK" || value === "ID_SUPPLIES") {
          next.itemType = "CONSUMABLE";
        }
        if (value !== "INK") {
          next.inkColor = "";
        }
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        editingId ? `/api/inventory/items/${editingId}` : "/api/inventory/items",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to save item");
        return;
      }

      toast.success(editingId ? "Item updated" : "Item created");
      if (!editingId) {
        setValues(emptyValues);
      }
      onSaved(data);
    } catch {
      toast.error("Failed to save item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle>{editingId ? "Edit item" : "Create item"}</CardTitle>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={values.brand}
              onChange={(e) => updateField("brand", e.target.value)}
              placeholder="e.g. Epson, HP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={values.model}
              onChange={(e) => updateField("model", e.target.value)}
              placeholder="e.g. T664, GT52"
            />
          </div>

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

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Optional remarks"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create item"}
            </Button>
            {editingId && onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
