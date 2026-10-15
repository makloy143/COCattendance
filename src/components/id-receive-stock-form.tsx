"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatManilaDateInput } from "@/lib/date-utils";
import {
  ID_STOCK_ITEM_LABELS,
  ID_STOCK_ITEM_TYPES,
  formatCount,
  type IdStockItemType,
} from "@/lib/id-maintenance";

export function IdReceiveStockForm({
  cardsPerBox,
  slingsPerBundle,
  lockedType,
}: {
  cardsPerBox: number;
  slingsPerBundle: number;
  lockedType?: IdStockItemType;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itemType, setItemType] = useState<IdStockItemType>(lockedType ?? "ID_CARD_BOX");
  const [packsReceived, setPacksReceived] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("Main COC");
  const [dateReceived, setDateReceived] = useState(() =>
    formatManilaDateInput(new Date())
  );

  const unitsPerPack = itemType === "ID_CARD_BOX" ? cardsPerBox : slingsPerBundle;
  const packs = Number(packsReceived);
  const unitsAdded = Number.isFinite(packs) && packs > 0 ? Math.floor(packs) * unitsPerPack : 0;
  const unitLabel = itemType === "ID_CARD_BOX" ? "Cards Added" : "Slings Added";

  const hint = useMemo(() => {
    if (itemType === "ID_CARD_BOX") {
      return `Each ID card box adds ${formatCount(cardsPerBox)} cards to stock.`;
    }
    return `Each sling bundle adds ${formatCount(slingsPerBundle)} slings. Each sling is counted individually.`;
  }, [itemType, cardsPerBox, slingsPerBundle]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/id/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType,
          packsReceived,
          receivedFrom,
          dateReceived,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to record stock");
        return;
      }
      toast.success(
        itemType === "ID_CARD_BOX"
          ? `Added ${formatCount(data.unitsAdded)} ID cards`
          : `Added ${formatCount(data.unitsAdded)} slings`
      );
      setPacksReceived("");
      router.refresh();
    } catch {
      toast.error("Failed to record stock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#0e6b43]/20 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-[#0e6b43] px-4 py-3 text-white">
        <PackagePlus className="size-4" />
        <h2 className="text-sm font-semibold sm:text-base">Receive Stock from Main COC</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="itemType">Item Type</Label>
          {lockedType ? (
            <Input id="itemType" value={ID_STOCK_ITEM_LABELS[lockedType]} readOnly />
          ) : (
            <Select
              value={itemType}
              onValueChange={(value) => {
                if (value === "ID_CARD_BOX" || value === "SLING_BUNDLE") {
                  setItemType(value);
                }
              }}
            >
              <SelectTrigger id="itemType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ID_STOCK_ITEM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ID_STOCK_ITEM_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="packsReceived">Boxes or Quantity Received</Label>
            <Input
              id="packsReceived"
              inputMode="numeric"
              value={packsReceived}
              onChange={(event) => setPacksReceived(event.target.value)}
              placeholder="15"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unitsAdded">{unitLabel}</Label>
            <Input
              id="unitsAdded"
              value={unitsAdded ? formatCount(unitsAdded) : ""}
              placeholder="0"
              readOnly
            />
            <p className="text-[11px] text-slate-500">
              {packs > 0
                ? `${Math.floor(packs)} × ${formatCount(unitsPerPack)}`
                : `Enter quantity to calculate`}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dateReceived">Date Received</Label>
            <Input
              id="dateReceived"
              type="date"
              value={dateReceived}
              onChange={(event) => setDateReceived(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receivedFrom">Received From</Label>
            <Input
              id="receivedFrom"
              value={receivedFrom}
              onChange={(event) => setReceivedFrom(event.target.value)}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="h-10 w-full bg-[#0e6b43] text-white hover:bg-[#0c5b39]"
          disabled={loading}
        >
          <PackagePlus className="size-4" />
          {loading ? "Recording..." : "Record Stock Receipt"}
        </Button>
        <p className="text-center text-[11px] text-slate-500">{hint}</p>
      </form>
    </section>
  );
}
