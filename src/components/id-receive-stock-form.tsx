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
  ID_RECEIPT_ITEM_TYPES,
  ID_RECEIPT_UNIT_LABELS,
  ID_RECEIPT_UNITS,
  ID_STOCK_ITEM_LABELS,
  formatCount,
  formatStockItemTitle,
  isIdCardItem,
  isPrinterSupplyItem,
  isSlingItem,
  type IdReceiptItemType,
  type IdReceiptUnit,
} from "@/lib/id-maintenance";

export function IdReceiveStockForm({
  cardsPerBox,
  slingsPerBundle,
  allowedTypes = [...ID_RECEIPT_ITEM_TYPES],
}: {
  cardsPerBox: number;
  slingsPerBundle: number;
  allowedTypes?: IdReceiptItemType[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itemType, setItemType] = useState<IdReceiptItemType>(allowedTypes[0] ?? "ID_CARD");
  const [unit, setUnit] = useState<IdReceiptUnit>("BOX");
  const [descriptionCode, setDescriptionCode] = useState("");
  const [packsReceived, setPacksReceived] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("Main COC");
  const [dateReceived, setDateReceived] = useState(() =>
    formatManilaDateInput(new Date())
  );

  const cardUnit = isIdCardItem(itemType) ? unit : isPrinterSupplyItem(itemType) ? "PIECE" : "BOX";
  const unitsPerPack = isIdCardItem(itemType)
    ? cardUnit === "PIECE"
      ? 1
      : cardsPerBox
    : isPrinterSupplyItem(itemType)
      ? 1
      : slingsPerBundle;
  const packs = Number(packsReceived);
  const unitsAdded =
    Number.isFinite(packs) && packs > 0 ? Math.floor(packs) * unitsPerPack : 0;
  const preview = formatStockItemTitle(itemType, descriptionCode);
  const quantityLabel = isIdCardItem(itemType)
    ? cardUnit === "PIECE"
      ? "Pieces received"
      : "Boxes received"
    : isSlingItem(itemType)
      ? "Bundles received"
      : "Pieces received";
  const addedLabel = isIdCardItem(itemType)
    ? "Cards added"
    : isSlingItem(itemType)
      ? "Slings added"
      : "Pieces added";

  const hint = useMemo(() => {
    if (isIdCardItem(itemType)) {
      return cardUnit === "PIECE"
        ? "A piece adds 1 PLAIN WHITE PVC CARD."
        : `Each box adds ${formatCount(cardsPerBox)} PLAIN WHITE PVC CARDS.`;
    }
    if (isSlingItem(itemType)) {
      return `Each bundle adds ${formatCount(slingsPerBundle)} slings. Student and employee slings are tracked separately.`;
    }
    return "Each piece is counted as 1. This does not change ID card or sling stock.";
  }, [itemType, cardUnit, cardsPerBox, slingsPerBundle]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/id/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType,
          unit: cardUnit,
          descriptionCode,
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
      toast.success(`Added ${formatCount(data.unitsAdded)} · ${preview}`);
      setPacksReceived("");
      setDescriptionCode("");
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
          {allowedTypes.length === 1 ? (
            <Input id="itemType" value={ID_STOCK_ITEM_LABELS[itemType]} readOnly />
          ) : (
            <Select
              value={itemType}
              onValueChange={(value) => {
                if (value && (allowedTypes as string[]).includes(value)) {
                  setItemType(value as IdReceiptItemType);
                }
              }}
            >
              <SelectTrigger id="itemType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ID_STOCK_ITEM_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isIdCardItem(itemType) ? (
          <div className="space-y-1.5">
            <Label htmlFor="receiptUnit">Box or piece</Label>
            <Select
              value={unit}
              onValueChange={(value) => {
                if (value === "BOX" || value === "PIECE") setUnit(value);
              }}
            >
              <SelectTrigger id="receiptUnit" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ID_RECEIPT_UNITS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {ID_RECEIPT_UNIT_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="descriptionCode">Description #</Label>
          <Input
            id="descriptionCode"
            value={descriptionCode}
            onChange={(event) => setDescriptionCode(event.target.value)}
            placeholder={isPrinterSupplyItem(itemType) ? "3/22" : "29"}
            required
          />
          <p className="text-[11px] text-slate-500">{preview || "Example: PLAIN WHITE PVC CARD #29"}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="packsReceived">{quantityLabel}</Label>
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
            <Label htmlFor="unitsAdded">{addedLabel}</Label>
            <Input
              id="unitsAdded"
              value={unitsAdded ? formatCount(unitsAdded) : ""}
              placeholder="0"
              readOnly
            />
            <p className="text-[11px] text-slate-500">
              {packs > 0
                ? `${Math.floor(packs)} × ${formatCount(unitsPerPack)}`
                : "Enter quantity to calculate"}
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
