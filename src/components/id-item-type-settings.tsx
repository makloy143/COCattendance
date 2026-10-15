"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  ID_STOCK_CATEGORIES,
  ID_STOCK_CATEGORY_LABELS,
  type IdStockCategory,
} from "@/lib/id-maintenance";

export type IdItemTypeRow = {
  id: string;
  name: string;
  category: IdStockCategory;
  active: boolean;
  receiptCount: number;
};

function categoryLabel(value: unknown) {
  if (
    value === "ID_CARD" ||
    value === "SLING_STUDENT" ||
    value === "SLING_EMPLOYEE" ||
    value === "SUPPLY"
  ) {
    return ID_STOCK_CATEGORY_LABELS[value];
  }
  return "Counts as";
}

export function IdItemTypeSettings({ options }: { options: IdItemTypeRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<IdStockCategory>("ID_CARD");
  const [adding, setAdding] = useState(false);
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((option) => [option.id, option.name]))
  );
  const [categories, setCategories] = useState<Record<string, IdStockCategory>>(() =>
    Object.fromEntries(options.map((option) => [option.category ? option.id : option.id, option.category]))
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function addItemType(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);
    try {
      const response = await fetch("/api/inventory/id/item-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to add item type");
        return;
      }
      toast.success("Item type added");
      setName("");
      router.refresh();
    } catch {
      toast.error("Failed to add item type");
    } finally {
      setAdding(false);
    }
  }

  async function saveItemType(option: IdItemTypeRow) {
    setPendingId(option.id);
    try {
      const response = await fetch(`/api/inventory/id/item-types/${option.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: names[option.id] ?? option.name,
          category: option.receiptCount > 0 ? option.category : categories[option.id] ?? option.category,
          active: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to rename item type");
        return;
      }
      toast.success("Item type saved");
      router.refresh();
    } catch {
      toast.error("Failed to rename item type");
    } finally {
      setPendingId(null);
    }
  }

  async function removeItemType(option: IdItemTypeRow) {
    setPendingId(option.id);
    try {
      const response = await fetch(`/api/inventory/id/item-types/${option.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to remove item type");
        return;
      }
      toast.success(
        data.deactivated
          ? "Removed from the item type list. Past receipts still show this name."
          : "Item type removed"
      );
      router.refresh();
    } catch {
      toast.error("Failed to remove item type");
    } finally {
      setPendingId(null);
    }
  }

  async function restoreItemType(option: IdItemTypeRow) {
    setPendingId(option.id);
    try {
      const response = await fetch(`/api/inventory/id/item-types/${option.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to restore item type");
        return;
      }
      toast.success("Item type restored");
      router.refresh();
    } catch {
      toast.error("Failed to restore item type");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="max-w-3xl space-y-4 rounded-xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold">Item types</h2>
        <p className="mt-1 text-sm text-slate-600">
          These names appear in Item type when you receive stock. ID card names
          share the card balance and can be a box or a piece. Student and
          employee slings stay separate. Piece only items do not change card or
          sling stock.
        </p>
      </div>

      <form onSubmit={addItemType} className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="newItemType">New item type</Label>
          <Input
            id="newItemType"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="PLAIN WHITE PVC CARD"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newItemCategory">Counts as</Label>
          <Select
            value={category}
            onValueChange={(value) => {
              if (
                value === "ID_CARD" ||
                value === "SLING_STUDENT" ||
                value === "SLING_EMPLOYEE" ||
                value === "SUPPLY"
              ) {
                setCategory(value);
              }
            }}
          >
            <SelectTrigger id="newItemCategory" className="w-full">
              <SelectValue>{(value) => categoryLabel(value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ID_STOCK_CATEGORIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {ID_STOCK_CATEGORY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={adding} className="bg-[#0e6b43] text-white hover:bg-[#0c5b39]">
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      <ul className="divide-y rounded-lg border">
        {options.map((option) => (
          <li key={option.id} className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor={`item-type-${option.id}`}>Name</Label>
              <Input
                id={`item-type-${option.id}`}
                value={names[option.id] ?? option.name}
                onChange={(event) =>
                  setNames((current) => ({ ...current, [option.id]: event.target.value }))
                }
                disabled={!option.active}
                required
              />
              {!option.active ? (
                <p className="text-[11px] text-slate-500">Removed from the receive form.</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`item-category-${option.id}`}>Counts as</Label>
              {option.receiptCount > 0 ? (
                <Input
                  id={`item-category-${option.id}`}
                  value={ID_STOCK_CATEGORY_LABELS[option.category]}
                  readOnly
                />
              ) : (
                <Select
                  value={categories[option.id] ?? option.category}
                  onValueChange={(value) => {
                    if (
                      value === "ID_CARD" ||
                      value === "SLING_STUDENT" ||
                      value === "SLING_EMPLOYEE" ||
                      value === "SUPPLY"
                    ) {
                      setCategories((current) => ({ ...current, [option.id]: value }));
                    }
                  }}
                  disabled={!option.active}
                >
                  <SelectTrigger id={`item-category-${option.id}`} className="w-full">
                    <SelectValue>
                      {(value) => categoryLabel(value) === "Counts as"
                        ? ID_STOCK_CATEGORY_LABELS[option.category]
                        : categoryLabel(value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ID_STOCK_CATEGORIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {ID_STOCK_CATEGORY_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex gap-2">
              {option.active ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pendingId === option.id}
                    onClick={() => saveItemType(option)}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pendingId === option.id}
                    onClick={() => removeItemType(option)}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pendingId === option.id}
                  onClick={() => restoreItemType(option)}
                >
                  Restore
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
