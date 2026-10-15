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
import { getIdStockView, listIdReceipts } from "@/lib/id-maintenance-data";
import { formatCount, formatIdDate, formatStockItemTitle, ID_RECEIPT_UNIT_LABELS } from "@/lib/id-maintenance";

export const dynamic = "force-dynamic";

export default async function IdInventoryPage() {
  await requireInventorySession();
  const [stock, receipts] = await Promise.all([
    getIdStockView(),
    listIdReceipts(["ID_CARD", "ID_CARD_BOX"]),
  ]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">ID card inventory</h2>
        <p className="mt-1 text-sm text-slate-600">{stock.cardPackNote}</p>
        <p className="mt-3 text-sm text-slate-700">
          Remaining{" "}
          <strong className="tabular-nums">{formatCount(stock.cardsRemaining)}</strong> ={" "}
          {formatCount(stock.cardsReceived)} received − {formatCount(stock.cardsReleased)}{" "}
          released − {formatCount(stock.cardsWasted)} bad-print
        </p>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Cards received</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {["Date", "Item", "Unit", "Quantity", "Cards added", "Received from", "Recorded by", ""].map(
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
                    No PLAIN WHITE PVC CARD stock received yet.
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>{formatIdDate(receipt.dateReceived)}</TableCell>
                    <TableCell>
                      {formatStockItemTitle(receipt.itemType, receipt.descriptionCode)}
                    </TableCell>
                    <TableCell>{ID_RECEIPT_UNIT_LABELS[receipt.unit]}</TableCell>
                    <TableCell className="tabular-nums">{receipt.packsReceived}</TableCell>
                    <TableCell className="tabular-nums">{formatCount(receipt.unitsAdded)}</TableCell>
                    <TableCell>{receipt.receivedFrom}</TableCell>
                    <TableCell>{receipt.recordedBy ?? "—"}</TableCell>
                    <TableCell>
                      <IdRemoveButton
                        endpoint={`/api/inventory/id/receipts/${receipt.id}`}
                        confirmMessage="Remove this receipt? This is blocked if those cards were already used."
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
          allowedTypes={["ID_CARD"]}
        />
      </div>
    </div>
  );
}
