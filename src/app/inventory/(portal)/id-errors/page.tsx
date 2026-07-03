"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
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
import { formatDate } from "@/lib/date-utils";
import {
  ID_ERROR_STATUS_LABELS,
  type IdErrorStatus,
} from "@/lib/inventory";
import { cn } from "@/lib/utils";

type IdErrorRecord = {
  id: string;
  personName: string;
  course: string;
  idNumber: string;
  datePrintedError: string;
  status: IdErrorStatus;
  reason: string;
  notes: string | null;
};

type StatusFilter = "ALL" | IdErrorStatus;

function IdErrorStatusBadge({ status }: { status: IdErrorStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "REPRINT" && "border-red-400 text-red-700",
        status === "RESOLVED" && "border-emerald-400 text-emerald-700",
        status === "CANCELLED" && "border-muted-foreground text-muted-foreground"
      )}
    >
      {ID_ERROR_STATUS_LABELS[status]}
    </Badge>
  );
}

export default function IdErrorsPage() {
  const [records, setRecords] = useState<IdErrorRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const response = await fetch(
        `/api/inventory/id-errors?${params.toString()}`
      );
      const data = await response.json();
      setRecords(data);
      setLoading(false);
    }

    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  async function markResolved(id: string) {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/inventory/id-errors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to update status");
        return;
      }

      toast.success("Marked as resolved");
      setRecords((current) =>
        current.map((r) => (r.id === id ? data : r))
      );
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  const countLabel = useMemo(() => {
    if (loading) return "Loading...";
    return `${records.length} record${records.length === 1 ? "" : "s"}`;
  }, [records.length, loading]);

  const filterButtons: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "REPRINT", label: "Reprint" },
    { value: "RESOLVED", label: "Resolved" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            ID Errors
          </h1>
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        </div>
        <ButtonLink href="/inventory/id-errors/new">
          <Plus className="size-4" />
          Log ID Error
        </ButtonLink>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, course, ID #..."
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

      {!loading && records.length === 0 ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          No ID error records found.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-xl border border-l-4 border-l-yellow-500 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{record.personName}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.course} · {record.idNumber}
                    </p>
                  </div>
                  <IdErrorStatusBadge status={record.status} />
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(record.datePrintedError)}
                  </p>
                  <p>{record.reason}</p>
                  {record.status === "REPRINT" && (
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      disabled={updatingId === record.id}
                      onClick={() => markResolved(record.id)}
                    >
                      {updatingId === record.id
                        ? "Updating..."
                        : "Mark Resolved"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <ResponsiveTableShell className="hidden md:block" minWidthClassName="min-w-[960px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>ID #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.personName}
                    </TableCell>
                    <TableCell>{record.course}</TableCell>
                    <TableCell>{record.idNumber}</TableCell>
                    <TableCell>
                      {formatDate(record.datePrintedError)}
                    </TableCell>
                    <TableCell>
                      <IdErrorStatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate">
                      {record.reason}
                    </TableCell>
                    <TableCell>
                      {record.status === "REPRINT" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === record.id}
                          onClick={() => markResolved(record.id)}
                        >
                          {updatingId === record.id
                            ? "Updating..."
                            : "Mark Resolved"}
                        </Button>
                      )}
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
