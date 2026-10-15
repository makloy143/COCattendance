import { IdRemoveButton } from "@/components/id-record-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type IdSurrenderRow } from "@/lib/id-maintenance";

export function IdSurrenderTable({
  rows,
  showActions = false,
}: {
  rows: IdSurrenderRow[];
  showActions?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold">Withdrawn students</h2>
        <p className="text-xs text-slate-500">
          Students who withdrew and surrendered an ID card and sling.
        </p>
      </div>
      <Table>
        <TableHeader className="bg-[#e7f5ee]">
          <TableRow className="hover:bg-transparent">
            {["Name", "Course", "Year", "ID #", "Date", "Reason", "ID returned", "Sling returned", "Received by"].map(
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
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 10 : 9} className="py-8 text-center text-sm text-slate-500">
                No withdrawals for this period.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.personName}</TableCell>
                <TableCell>{row.course}</TableCell>
                <TableCell>{row.yearLevel || "—"}</TableCell>
                <TableCell className="tabular-nums">{row.idNumber}</TableCell>
                <TableCell className="tabular-nums">{row.dateLabel}</TableCell>
                <TableCell>{row.reason}</TableCell>
                <TableCell className="tabular-nums">{row.idCardsReturned}</TableCell>
                <TableCell className="tabular-nums">{row.slingsReturned}</TableCell>
                <TableCell>{row.receivedBy}</TableCell>
                {showActions ? (
                  <TableCell>
                    <IdRemoveButton
                      endpoint={`/api/inventory/id/surrenders/${row.id}`}
                      confirmMessage="Remove this withdrawal? The returned ID and sling will leave stock again."
                    />
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
