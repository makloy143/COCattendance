import { IdReceiveStockForm } from "@/components/id-receive-stock-form";
import { IdRemoveButton } from "@/components/id-record-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getIdStockView, listIdItemOptions, listIdReceipts } from "@/lib/id-maintenance-data";
import { formatCount, formatIdDate, receiptItemTitle } from "@/lib/id-maintenance";

export const dynamic = "force-dynamic";

export default async function SlingInventoryPage() {
  await requireInventorySession();
  const [stock, receipts, itemTypes] = await Promise.all([
    getIdStockView(),
    listIdReceipts(["SLING_STUDENT", "SLING_EMPLOYEE", "SLING_BUNDLE"]),
    listIdItemOptions({
      activeOnly: true,
      categories: ["SLING_STUDENT", "SLING_EMPLOYEE"],
    }),
  ]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Sling inventory</h2>
        <p className="mt-1 text-sm text-slate-600">{stock.slingPackNote}</p>
        <p className="mt-3 text-sm text-slate-700">
          Student remaining{" "}
          <strong className="tabular-nums">{formatCount(stock.studentSlingsRemaining)}</strong> ·
          Employee remaining{" "}
          <strong className="tabular-nums">{formatCount(stock.employeeSlingsRemaining)}</strong>
        </p>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Bundles received</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {["Date", "Item", "Bundles", "Slings / bundle", "Slings added", "Received from", "Recorded by", ""].map(
                  (heading) => (
                    <TableHead key={heading || "actions"}>{heading}</TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-slate-500">
                    No sling bundles received yet.
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>{formatIdDate(receipt.dateReceived)}</TableCell>
                    <TableCell>
                      {receiptItemTitle(receipt)}
                    </TableCell>
                    <TableCell className="tabular-nums">{receipt.packsReceived}</TableCell>
                    <TableCell className="tabular-nums">{receipt.unitsPerPack}</TableCell>
                    <TableCell className="tabular-nums">{formatCount(receipt.unitsAdded)}</TableCell>
                    <TableCell>{receipt.receivedFrom}</TableCell>
                    <TableCell>{receipt.recordedBy ?? "—"}</TableCell>
                    <TableCell>
                      <IdRemoveButton
                        endpoint={`/api/inventory/id/receipts/${receipt.id}`}
                        confirmMessage="Remove this receipt? This is blocked if those slings were already used."
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>
        <IdReceiveStockForm
          cardsPerBox={stock.cardsPerBox}
          slingsPerBundle={stock.slingsPerBundle}
          options={itemTypes.map((option) => ({
            id: option.id,
            name: option.name,
            category: option.category,
          }))}
        />
      </div>
    </div>
  );
}
