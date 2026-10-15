import Link from "next/link";
import { requireInventorySession } from "@/lib/inventory-auth";
import { listIdHistory } from "@/lib/id-maintenance-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCount,
  parseIdPeriod,
  type IdHistoryKind,
} from "@/lib/id-maintenance";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_FILTERS: Array<{ id: "all" | IdHistoryKind; label: string }> = [
  { id: "all", label: "All" },
  { id: "RECEIPT", label: "Stock receipts" },
  { id: "RELEASE", label: "ID releases" },
  { id: "BAD_PRINT", label: "Bad printing" },
];

const KIND_LABELS: Record<IdHistoryKind, string> = {
  RECEIPT: "Stock receipt",
  RELEASE: "ID release",
  BAD_PRINT: "Bad printing",
};

function formatMovement(value: number) {
  if (value > 0) return `+${formatCount(value)}`;
  if (value < 0) return `−${formatCount(Math.abs(value))}`;
  return "—";
}

export default async function IdHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; kind?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const period = parseIdPeriod(params.period);
  const kind =
    params.kind === "RECEIPT" || params.kind === "RELEASE" || params.kind === "BAD_PRINT"
      ? params.kind
      : "all";
  const events = await listIdHistory(period);
  const visible = kind === "all" ? events : events.filter((event) => event.kind === kind);

  function filterHref(nextKind: "all" | IdHistoryKind) {
    const query = new URLSearchParams();
    if (params.period) query.set("period", params.period);
    if (nextKind !== "all") query.set("kind", nextKind);
    const value = query.toString();
    return value ? `/inventory/id/history?${value}` : "/inventory/id/history";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {KIND_FILTERS.map((filter) => (
          <Link
            key={filter.id}
            href={filterHref(filter.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              kind === filter.id
                ? "border-[#0e6b43] bg-[#0e6b43] text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {["Date", "Type", "Record", "Detail", "Cards", "Slings"].map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  No stock or usage records for this period.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="tabular-nums">{event.dateLabel}</TableCell>
                  <TableCell>{KIND_LABELS[event.kind]}</TableCell>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell className="max-w-sm text-slate-600">{event.detail}</TableCell>
                  <TableCell
                    className={cn(
                      "tabular-nums",
                      event.cards > 0 && "text-[#0e6b43]",
                      event.cards < 0 && "text-[#c2414b]"
                    )}
                  >
                    {formatMovement(event.cards)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "tabular-nums",
                      event.slings > 0 && "text-[#0e6b43]",
                      event.slings < 0 && "text-[#c2414b]"
                    )}
                  >
                    {formatMovement(event.slings)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
