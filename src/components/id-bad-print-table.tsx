"use client";

import { useMemo, useState } from "react";
import { IdBadPrintStatusSelect, IdRemoveButton } from "@/components/id-record-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ID_BAD_PRINT_STATUSES,
  ID_BAD_PRINT_STATUS_LABELS,
  formatCount,
  wastesCardStock,
  type IdBadPrintRow,
  type IdBadPrintStatus,
} from "@/lib/id-maintenance";
import { IdStatusBadge } from "@/components/id-status-badge";

export function IdBadPrintTable({
  rows,
  showActions = false,
}: {
  rows: IdBadPrintRow[];
  showActions?: boolean;
}) {
  const [reason, setReason] = useState("ALL");
  const [status, setStatus] = useState<"ALL" | IdBadPrintStatus>("ALL");

  const reasons = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.reason))).sort();
  }, [rows]);

  const filtered = rows.filter((row) => {
    if (reason !== "ALL" && row.reason !== reason) return false;
    if (status !== "ALL" && row.status !== status) return false;
    return true;
  });

  const wasted = filtered.reduce(
    (sum, row) => sum + (wastesCardStock(row.status) ? row.quantity : 0),
    0
  );

  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">Bad Printing Records</h2>
          <span className="rounded-full bg-[#fdeeee] px-2.5 py-1 text-xs font-medium text-[#c2414b]">
            Bad-print quantity: {formatCount(wasted)} cards
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="text-xs text-slate-500">
            Reason
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="ml-2 h-8 rounded-md border bg-white px-2 text-sm text-slate-800"
            >
              <option value="ALL">All Reasons</option>
              {reasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "ALL" | IdBadPrintStatus)}
              className="ml-2 h-8 rounded-md border bg-white px-2 text-sm text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              {ID_BAD_PRINT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {ID_BAD_PRINT_STATUS_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <Table>
        <TableHeader className="bg-[#f6e7a1] [&_tr]:border-[#ead98a]">
          <TableRow className="hover:bg-transparent">
            {["Name", "Course", "ID #", "Date Printed", "Status", "Reason", "Quantity"].map(
              (heading) => (
                <TableHead key={heading} className="text-xs font-semibold tracking-wide text-slate-800 uppercase">
                  {heading}
                </TableHead>
              )
            )}
            {showActions ? (
              <TableHead className="text-xs font-semibold tracking-wide text-slate-800 uppercase">
                Actions
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 8 : 7} className="py-8 text-center text-sm text-slate-500">
                No bad printing records for this view.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.personName}</TableCell>
                <TableCell>{row.course}</TableCell>
                <TableCell className="tabular-nums">{row.idNumber}</TableCell>
                <TableCell className="tabular-nums">{row.dateLabel}</TableCell>
                <TableCell>
                  <IdStatusBadge status={row.status} />
                </TableCell>
                <TableCell>{row.reason}</TableCell>
                <TableCell className="tabular-nums">{row.quantity}</TableCell>
                {showActions ? (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <IdBadPrintStatusSelect id={row.id} status={row.status} />
                      <IdRemoveButton
                        endpoint={`/api/inventory/id/bad-prints/${row.id}`}
                        confirmMessage="Remove this bad printing record and return its wasted cards to stock?"
                      />
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}
