"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
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
import { ReturnItemDialog } from "@/components/return-item-dialog";
import { formatDate } from "@/lib/date-utils";
import { formatDateTime, formatItemDescription, type BorrowStatus } from "@/lib/inventory";

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
  dueDate: string | null;
  status: BorrowStatus;
  receivedItem: {
    id: string;
    itemName: string;
    brand: string | null;
    model: string | null;
    color: string | null;
    serialNumber: string | null;
  };
};

export default function ReturnsPage() {
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBorrow, setSelectedBorrow] = useState<BorrowRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function loadBorrows() {
      setLoading(true);
      const params = new URLSearchParams({
        status: "ACTIVE",
        equipmentOnly: "true",
      });
      if (search) params.set("search", search);
      const response = await fetch(`/api/inventory/borrows?${params.toString()}`);
      const data = await response.json();
      setBorrows(data);
      setLoading(false);
    }

    const timeout = setTimeout(loadBorrows, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading...";
    if (borrows.length === 0) return "All equipment returned";
    return `${borrows.length} item${borrows.length === 1 ? "" : "s"} out on borrow`;
  }, [borrows.length, loading]);

  function openReturnDialog(borrow: BorrowRecord) {
    setSelectedBorrow(borrow);
    setDialogOpen(true);
  }

  function handleReturnSuccess(updated: { id: string }) {
    setBorrows((current) => current.filter((b) => b.id !== updated.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Item Return
          </h1>
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        </div>
        <ButtonLink href="/inventory/borrows" variant="outline">
          Borrow History
        </ButtonLink>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by borrower, item, serial..."
          className="pl-9"
        />
      </div>

      {!loading && borrows.length === 0 ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 py-10 text-center dark:border-orange-900 dark:bg-orange-950/20">
          <p className="text-sm text-muted-foreground">
            No active equipment borrows — all items returned.
          </p>
          <ButtonLink href="/inventory/borrows/new" className="mt-4">
            Borrow Equipment
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {borrows.map((borrow) => (
              <div
                key={borrow.id}
                className="rounded-xl border border-l-4 border-l-orange-500 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{borrow.borrowerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {borrow.department}
                    </p>
                  </div>
                  <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">
                    Out
                  </Badge>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Item</p>
                    <p>{formatItemDescription(borrow.receivedItem)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Borrowed</p>
                    <p>
                      {formatDateTime(borrow.dateBorrowed, borrow.timeBorrowed)}
                    </p>
                  </div>
                  {borrow.dueDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Due</p>
                      <p>{formatDate(borrow.dueDate)}</p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => openReturnDialog(borrow)}
                  >
                    Process Return
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <ResponsiveTableShell className="hidden md:block" minWidthClassName="min-w-[960px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
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
                      {borrow.dueDate ? formatDate(borrow.dueDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">
                        Out
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => openReturnDialog(borrow)}
                      >
                        Process Return
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTableShell>
        </>
      )}

      <ReturnItemDialog
        borrow={selectedBorrow}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleReturnSuccess}
      />
    </div>
  );
}
