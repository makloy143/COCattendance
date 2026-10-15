import { IdInventoryOverview } from "@/components/id-stock-summary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireInventorySession } from "@/lib/inventory-auth";
import {
  getIdPeriodActivity,
  getIdStockView,
  listIdBadPrints,
  listIdReceipts,
  listIdReleases,
} from "@/lib/id-maintenance-data";
import { getIdPeriodRange } from "@/lib/id-maintenance";
import {
  ID_PERIOD_LABELS,
  ID_RELEASE_STATUS_LABELS,
  formatCount,
  formatIdDate,
  parseIdPeriod,
  wastesCardStock,
} from "@/lib/id-maintenance";

export const dynamic = "force-dynamic";

export default async function IdReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const period = parseIdPeriod(params.period);
  const range = getIdPeriodRange(period);
  const [stock, activity, receipts, releases, badPrints] = await Promise.all([
    getIdStockView(),
    getIdPeriodActivity(period),
    listIdReceipts(),
    listIdReleases(period),
    listIdBadPrints(period),
  ]);

  const periodReceipts = receipts.filter((receipt) => {
    if (!range) return true;
    return receipt.dateReceived >= range.start && receipt.dateReceived <= range.end;
  });

  const reasons = new Map<string, { count: number; quantity: number }>();
  for (const record of badPrints) {
    if (!wastesCardStock(record.status)) continue;
    const current = reasons.get(record.reason) ?? { count: 0, quantity: 0 };
    current.count += 1;
    current.quantity += record.quantity;
    reasons.set(record.reason, current);
  }

  const printers = new Map<string, { cards: number; slings: number }>();
  for (const release of releases) {
    const current = printers.get(release.printedBy) ?? { cards: 0, slings: 0 };
    current.cards += release.idCardsUsed;
    current.slings += release.slingsUsed;
    printers.set(release.printedBy, current);
  }

  const reasonRows = Array.from(reasons.entries()).sort((a, b) => b[1].quantity - a[1].quantity);
  const printerRows = Array.from(printers.entries()).sort((a, b) => b[1].cards - a[1].cards);

  return (
    <div className="space-y-4">
      <IdInventoryOverview stock={stock} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Cards released", activity.cardsReleased],
          ["Cards wasted", activity.cardsWasted],
          ["Slings used", activity.slingsUsed],
          ["Release records", activity.releaseCount],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
              {label} · {ID_PERIOD_LABELS[period]}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCount(Number(value))}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Printing errors by reason</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Cards wasted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reasonRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-sm text-slate-500">
                    No wasted cards in this period.
                  </TableCell>
                </TableRow>
              ) : (
                reasonRows.map(([reason, totals]) => (
                  <TableRow key={reason}>
                    <TableCell>{reason}</TableCell>
                    <TableCell className="tabular-nums">{totals.count}</TableCell>
                    <TableCell className="tabular-nums">{totals.quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Usage by person who printed</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Printed by</TableHead>
                <TableHead>ID cards used</TableHead>
                <TableHead>Slings used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printerRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-sm text-slate-500">
                    No releases in this period.
                  </TableCell>
                </TableRow>
              ) : (
                printerRows.map(([name, totals]) => (
                  <TableRow key={name}>
                    <TableCell>{name}</TableCell>
                    <TableCell className="tabular-nums">{totals.cards}</TableCell>
                    <TableCell className="tabular-nums">{totals.slings}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Stock movements</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {["Date", "Item", "Packs", "Units added", "Received from"].map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {periodReceipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                  No stock received in this period.
                </TableCell>
              </TableRow>
            ) : (
              periodReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>{formatIdDate(receipt.dateReceived)}</TableCell>
                  <TableCell>
                    {receipt.itemType === "ID_CARD_BOX" ? "ID card box" : "Sling bundle"}
                  </TableCell>
                  <TableCell className="tabular-nums">{receipt.packsReceived}</TableCell>
                  <TableCell className="tabular-nums">{formatCount(receipt.unitsAdded)}</TableCell>
                  <TableCell>{receipt.receivedFrom}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Transaction history</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {["Date", "Name", "Status", "Reason", "Printed by", "Cards", "Slings"].map(
                (heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {releases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-sm text-slate-500">
                  No release transactions in this period.
                </TableCell>
              </TableRow>
            ) : (
              releases.map((release) => (
                <TableRow key={release.id}>
                  <TableCell>{formatIdDate(release.transactionDate)}</TableCell>
                  <TableCell>{release.personName}</TableCell>
                  <TableCell>{ID_RELEASE_STATUS_LABELS[release.status]}</TableCell>
                  <TableCell>{release.reason}</TableCell>
                  <TableCell>{release.printedBy}</TableCell>
                  <TableCell className="tabular-nums">{release.idCardsUsed}</TableCell>
                  <TableCell className="tabular-nums">{release.slingsUsed}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
