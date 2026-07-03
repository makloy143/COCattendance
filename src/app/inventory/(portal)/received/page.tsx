"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightFromLine, Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTableShell } from "@/components/responsive-table-shell";
import { formatDate } from "@/lib/date-utils";
import {
  formatItemDescription,
  getItemCategoryLabel,
  getItemTypeLabel,
  type ItemCategory,
  type ItemType,
} from "@/lib/inventory";

type ReceivedItem = {
  id: string;
  itemName: string;
  itemType: ItemType;
  category: ItemCategory;
  brand: string | null;
  model: string | null;
  color: string | null;
  serialNumber: string | null;
  quantity: number;
  availableQuantity: number;
  senderName: string;
  senderSource: string;
  receivedByDepartment: string;
  dateReceived: string;
};

export default function ReceivedItemsPage() {
  const [items, setItems] = useState<ReceivedItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const response = await fetch(`/api/inventory/received?${params.toString()}`);
      const data = await response.json();
      setItems(data);
      setLoading(false);
    }

    const timeout = setTimeout(loadItems, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading received items...";
    return `${items.length} received item${items.length === 1 ? "" : "s"}`;
  }, [items.length, loading]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Received Items
          </h1>
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/inventory/received/release" variant="outline">
            <ArrowRightFromLine className="size-4" />
            Release Item
          </ButtonLink>
          <ButtonLink href="/inventory/received/new">
            <Plus className="size-4" />
            Log Received Item
          </ButtonLink>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item, brand, model, sender..."
          className="pl-9"
        />
      </div>

      {!loading && items.length === 0 ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          No received items yet. Log your first item from COC Main.
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
                  <Badge variant="outline">{getItemCategoryLabel(item.category)}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Available</p>
                    <p>
                      {item.availableQuantity} / {item.quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date received</p>
                    <p>{formatDate(item.dateReceived)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Received by</p>
                    <p className="truncate">
                      {item.senderName} · {item.receivedByDepartment}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ResponsiveTableShell className="hidden md:block" minWidthClassName="min-w-[960px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Received by</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {[item.brand, item.model, item.color, item.serialNumber]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getItemCategoryLabel(item.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getItemTypeLabel(item.itemType)}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.availableQuantity} / {item.quantity}
                    </TableCell>
                    <TableCell>{item.senderName}</TableCell>
                    <TableCell>{item.receivedByDepartment}</TableCell>
                    <TableCell>{formatDate(item.dateReceived)}</TableCell>
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
