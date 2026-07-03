"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTableShell } from "@/components/responsive-table-shell";
import { BorrowStatusBadge } from "@/components/borrow-status-badge";
import { formatDate } from "@/lib/date-utils";
import {
  formatDateTime,
  formatItemDescription,
  type BorrowStatus,
} from "@/lib/inventory";

type BorrowRecord = {
  id: string;
  borrowerName: string;
  department: string;
  quantityBorrowed: number;
  dateBorrowed: string;
  timeBorrowed: string | null;
  dateReturned: string | null;
  timeReturned: string | null;
  returnerName: string | null;
  receivedByName: string | null;
  status: BorrowStatus;
  receivedItem: {
    id: string;
    itemName: string;
    brand: string | null;
    model: string | null;
    color: string | null;
    serialNumber: string | null;
    itemType: string;
  };
};

type StatusFilter = "ALL" | "ACTIVE" | "RETURNED";

export default function BorrowsPage() {
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBorrows() {
      setLoading(true);
      const params = new URLSearchParams({ equipmentOnly: "true" });
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const response = await fetch(`/api/inventory/borrows?${params.toString()}`);
      const data = await response.json();
      setBorrows(data);
      setLoading(false);
    }

    const timeout = setTimeout(loadBorrows, 300);
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading borrow records...";
    return `${borrows.length} borrow record${borrows.length === 1 ? "" : "s"}`;
  }, [borrows.length, loading]);

  const filterButtons: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "RETURNED", label: "Returned" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Borrow History
          </h1>
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/inventory/returns" variant="outline">
            Item Return
          </ButtonLink>
          <ButtonLink href="/inventory/borrows/new">
            <Plus className="size-4" />
            Borrow Item
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by borrower, department, item..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={statusFilter === filter.value ? "default" : "outline"}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {!loading && borrows.length === 0 ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          No borrow records found.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {borrows.map((borrow) => (
              <div key={borrow.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{borrow.borrowerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {borrow.department}
                    </p>
                  </div>
                  <BorrowStatusBadge status={borrow.status} />
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Item</p>
                    <p>{formatItemDescription(borrow.receivedItem)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Borrowed</p>
                      <p>
                        {formatDateTime(borrow.dateBorrowed, borrow.timeBorrowed)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Returned</p>
                      <p>
                        {borrow.dateReturned
                          ? formatDateTime(borrow.dateReturned, borrow.timeReturned)
                          : "—"}
                      </p>
                    </div>
                    {borrow.returnerName && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Return by / Received by
                        </p>
                        <p>
                          {borrow.returnerName}
                          {borrow.receivedByName
                            ? ` · ${borrow.receivedByName}`
                            : ""}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ResponsiveTableShell className="hidden md:block" minWidthClassName="min-w-[1100px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead>Return by</TableHead>
                  <TableHead>Received by</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrows.map((borrow) => (
                  <TableRow key={borrow.id}>
                    <TableCell className="font-medium">
                      {borrow.borrowerName}
                    </TableCell>
                    <TableCell>{borrow.department}</TableCell>
                    <TableCell>
                      {formatItemDescription(borrow.receivedItem)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(borrow.dateBorrowed, borrow.timeBorrowed)}
                    </TableCell>
                    <TableCell>
                      {borrow.dateReturned
                        ? formatDateTime(borrow.dateReturned, borrow.timeReturned)
                        : "—"}
                    </TableCell>
                    <TableCell>{borrow.returnerName ?? "—"}</TableCell>
                    <TableCell>{borrow.receivedByName ?? "—"}</TableCell>
                    <TableCell>
                      <BorrowStatusBadge status={borrow.status} />
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
