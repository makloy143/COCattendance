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

export function IdSlingReleaseTable({
  rows,
  slingsUsed,
  truncated = false,
}: {
  rows: IdReleaseRow[];
  slingsUsed: number;
  truncated?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <h2 className="text-base font-semibold">Sling release log</h2>
        <p className="text-sm text-slate-600">
          Slings used:{" "}
          <strong className="text-slate-900 tabular-nums">{formatCount(slingsUsed)}</strong>
        </p>
      </div>
      <Table className="min-w-[48rem]">
        <TableHeader className="bg-[#f8efc3] [&_tr]:border-[#ead98a]">
          <TableRow className="hover:bg-transparent">
            {["Name", "Course", "ID #", "Date", "Status", "Category", "Released by", "Sling for", "Slings used", "Actions"].map(
              (heading) => (
                <TableHead
                  key={heading}
                  className={heading === "Actions" ? "sticky right-0 z-10 bg-[#f8efc3] text-xs font-semibold tracking-wide text-slate-800 uppercase" : "text-xs font-semibold tracking-wide text-slate-800 uppercase"}
                >
                  {heading}
                </TableHead>
              )
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="py-8 text-center text-sm text-slate-500">
                No sling releases for this period.
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
                  <IdReleaseReasonEditor id={row.id} reason={row.reason} />
                </TableCell>
                <TableCell>{row.releasedBy || row.printedBy}</TableCell>
                <TableCell>
                  {row.slingKind ? ID_SLING_KIND_LABELS[row.slingKind] : "Student"}
                </TableCell>
                <TableCell className="tabular-nums">{formatCount(row.slingsUsed)}</TableCell>
                <TableCell className="sticky right-0 z-10 bg-white">
                  <IdRemoveButton
                    endpoint={`/api/inventory/id/releases/${row.id}`}
                    confirmMessage={
                      row.idCardsUsed > 0
                        ? "Remove this release and return the slings and ID cards it used to stock?"
                        : "Remove this sling release and return the slings to stock?"
                    }
                  />
                </TableCell>
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
