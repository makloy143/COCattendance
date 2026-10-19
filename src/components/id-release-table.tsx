import { IdReleaseReasonEditor, IdRemoveButton } from "@/components/id-record-actions";
import { IdStatusBadge } from "@/components/id-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCount, ID_SLING_KIND_LABELS, type IdReleaseRow } from "@/lib/id-maintenance";

export function IdReleaseTable({
  rows,
  cardsUsed,
  slingsUsed,
  showActions = false,
  truncated = false,
}: {
  rows: IdReleaseRow[];
  cardsUsed: number;
  slingsUsed: number;
  showActions?: boolean;
  truncated?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">ID Release & Sling Usage Log</h2>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span>
            ID cards used:{" "}
            <strong className="text-slate-900 tabular-nums">{formatCount(cardsUsed)}</strong>
          </span>
          <span>
            Slings used:{" "}
            <strong className="text-slate-900 tabular-nums">{formatCount(slingsUsed)}</strong>
          </span>
        </div>
      </div>
      <Table>
        <TableHeader className="bg-[#f8efc3] [&_tr]:border-[#ead98a]">
          <TableRow className="hover:bg-transparent">
            {[
              "Name",
              "Course",
              "ID #",
              "Date",
              "Status",
              "Reason / Transaction",
              "Printed By",
              "PVC card",
              "ID Card Used",
              "Sling Used",
            ].map((heading) => (
              <TableHead
                key={heading}
                className="text-xs font-semibold tracking-wide text-slate-800 uppercase"
              >
                {heading}
              </TableHead>
            ))}
            {showActions ? (
              <TableHead className="sticky right-0 z-10 bg-[#f8efc3] text-xs font-semibold tracking-wide text-slate-800 uppercase">
                Actions
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showActions ? 11 : 10}
                className="py-8 text-center text-sm text-slate-500"
              >
                No ID releases for this period.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.personName}</TableCell>
                <TableCell>{row.course}</TableCell>
                <TableCell className="tabular-nums">{row.idNumber}</TableCell>
                <TableCell className="tabular-nums">{row.dateLabel}</TableCell>
                <TableCell>
                  <IdStatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  {showActions ? (
                    <IdReleaseReasonEditor id={row.id} reason={row.reason} />
                  ) : (
                    row.reason
                  )}
                </TableCell>
                <TableCell>{row.printedBy}</TableCell>
                <TableCell>
                  {row.pvcCardName
                    ? `${row.pvcCardName}${row.pvcCardEnded ? " · ended" : ""}`
                    : "—"}
                </TableCell>
                <TableCell className="tabular-nums">{row.idCardsUsed}</TableCell>
                <TableCell className="tabular-nums">
                  {row.slingsUsed}
                  {row.slingsUsed > 0 && row.slingKind
                    ? ` ${ID_SLING_KIND_LABELS[row.slingKind].toLowerCase()}`
                    : ""}
                </TableCell>
                {showActions ? (
                  <TableCell className="sticky right-0 z-10 bg-white">
                    <IdRemoveButton
                      endpoint={`/api/inventory/id/releases/${row.id}`}
                      confirmMessage="Remove this release and return the cards and slings it used to stock?"
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {truncated ? (
        <p className="border-t px-4 py-2 text-xs text-slate-500">
          Showing the latest {rows.length} records in this period.
        </p>
      ) : null}
    </section>
  );
}
