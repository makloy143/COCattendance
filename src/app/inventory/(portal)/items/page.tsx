"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { InventoryCatalogForm } from "@/components/inventory-catalog-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTableShell } from "@/components/responsive-table-shell";
import {
  formatItemDescription,
  getInkColorLabel,
  getItemCategoryLabel,
  getItemTypeLabel,
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
  type InventoryCatalogItem,
  type ItemCategory,
} from "@/lib/inventory";

type CategoryFilter = "ALL" | ItemCategory;

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryCatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InventoryCatalogItem | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function loadItems() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("all", "true");
    if (search) params.set("search", search);
    if (category !== "ALL") params.set("category", category);
    const response = await fetch(`/api/inventory/items?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Failed to load items");
      setItems([]);
      setLoading(false);
      return;
    }
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadItems();
    }, 300);
    return () => clearTimeout(timeout);
    // Reload whenever search or category filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  async function handleToggle(item: InventoryCatalogItem) {
    const response = await fetch(`/api/inventory/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Failed to update item");
      return;
    }
    toast.success(data.isActive ? `Activated "${data.itemName}"` : `Hidden "${data.itemName}"`);
    await loadItems();
  }

  async function handleDelete(item: InventoryCatalogItem) {
    if (!confirm(`Remove "${item.itemName}" from the catalog?`)) return;

    const response = await fetch(`/api/inventory/items/${item.id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Failed to delete item");
      return;
    }
    toast.success(`Removed "${item.itemName}"`);
    if (editing?.id === item.id) {
      setEditing(null);
      setFormKey((key) => key + 1);
    }
    await loadItems();
  }

  const countLabel = useMemo(() => {
    if (loading) return "Loading catalog...";
    return `${items.length} catalog item${items.length === 1 ? "" : "s"}`;
  }, [items.length, loading]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Items
        </h1>
        <p className="text-sm text-muted-foreground">
          Create reusable items such as inks, models, and supplies. Use them
          when logging received stock.
        </p>
      </div>

      <InventoryCatalogForm
        key={`${formKey}-${editing?.id ?? "new"}`}
        item={editing}
        onSaved={async () => {
          setEditing(null);
          setFormKey((key) => key + 1);
          await loadItems();
        }}
        onCancel={() => {
          setEditing(null);
          setFormKey((key) => key + 1);
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{countLabel}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, brand, model..."
              className="pl-9"
            />
          </div>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as CategoryFilter)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {ITEM_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {ITEM_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!loading && items.length === 0 ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          No catalog items yet. Create an ink, model, or supply above.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatItemDescription(item)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {getItemCategoryLabel(item.category)}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{getItemTypeLabel(item.itemType)}</Badge>
                  {item.inkColor ? (
                    <Badge variant="outline">{getInkColorLabel(item.inkColor)}</Badge>
                  ) : null}
                  <Badge variant={item.isActive ? "outline" : "secondary"}>
                    {item.isActive ? "Active" : "Hidden"}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(item)}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleToggle(item)}
                  >
                    {item.isActive ? "Hide" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDelete(item)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <ResponsiveTableShell className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Brand / model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.itemName}</p>
                      {item.inkColor ? (
                        <p className="text-xs text-muted-foreground">
                          {getInkColorLabel(item.inkColor)}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>{getItemCategoryLabel(item.category)}</TableCell>
                    <TableCell>{getItemTypeLabel(item.itemType)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[item.brand, item.model].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "outline" : "secondary"}>
                        {item.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(item)}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleToggle(item)}
                        >
                          {item.isActive ? "Hide" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleDelete(item)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTableShell>
        </>
      )}
    </div>
  );
}
