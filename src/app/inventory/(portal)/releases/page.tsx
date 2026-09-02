"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightFromLine, Search } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  formatDateTime,
  formatItemDescription,
  getItemCategoryLabel,
  ITEM_CATEGORIES,
  type ItemCategory,
} from "@/lib/inventory";

type ReleaseLog = {
  id: string;
  borrowerName: string;
  department: string;
  quantityBorrowed: number;
  dateBorrowed: string;
  timeBorrowed: string | null;
  notes: string | null;
  createdAt: string;
  receivedItem: {
    id: string;
    itemName: string;
    category: ItemCategory;
    brand: string | null;
    model: string | null;
    color: string | null;
    serialNumber: string | null;
  };
};

type CategoryFilter = "ALL" | ItemCategory;

export default function ReleaseLogsPage() {
  const [logs, setLogs] = useState<ReleaseLog[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ itemType: "CONSUMABLE" });
        if (search) params.set("search", search);
        const response = await fetch(
          `/api/inventory/borrows?${params.toString()}`
        );
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(loadLogs, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const filteredLogs = useMemo(() => {
    if (categoryFilter === "ALL") return logs;
    return logs.filter((log) => log.receivedItem.category === categoryFilter);
  }, [logs, categoryFilter]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading release logs...";
    return `${filteredLogs.length} release log${filteredLogs.length === 1 ? "" : "s"}`;
  }, [filteredLogs.length, loading]);

  const filterButtons: { value: CategoryFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    ...ITEM_CATEGORIES.map((category) => ({
      value: category,
      label: getItemCategoryLabel(category),
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Release Logs
          </h1>
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        </div>
        <ButtonLink href="/inventory/received/release">
          <ArrowRightFromLine className="size-4" />
          Release Item
        </ButtonLink>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by person, department, item..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={categoryFilter === filter.value ? "default" : "outline"}
              onClick={() => setCategoryFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {!loading && filteredLogs.length === 0 ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          No release logs found. Released consumables will appear here.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-l-4 border-l-emerald-500 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {formatItemDescription(log.receivedItem)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.borrowerName} · {log.department}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {getItemCategoryLabel(log.receivedItem.category)}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p>{log.quantityBorrowed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Released</p>
                    <p>{formatDateTime(log.dateBorrowed, log.timeBorrowed)}</p>
                  </div>
                  {log.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p>{log.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <ResponsiveTableShell
            className="hidden md:block"
            minWidthClassName="min-w-[1100px]"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Used by</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Released</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {formatItemDescription(log.receivedItem)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getItemCategoryLabel(log.receivedItem.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.quantityBorrowed}</TableCell>
                    <TableCell>{log.borrowerName}</TableCell>
                    <TableCell>{log.department}</TableCell>
                    <TableCell>
                      {formatDateTime(log.dateBorrowed, log.timeBorrowed)}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate">
                      {log.notes ?? "—"}
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
