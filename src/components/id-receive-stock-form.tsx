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
  ID_RECEIPT_UNIT_LABELS,
  ID_RECEIPT_UNITS,
  formatCount,
  formatStockItemTitle,
  type IdItemTypeOption,
  type IdReceiptUnit,
} from "@/lib/id-maintenance";

export function IdReceiveStockForm({
  cardsPerBox,
  slingsPerBundle,
  options,
}: {
  cardsPerBox: number;
  slingsPerBundle: number;
  options: IdItemTypeOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itemOptionId, setItemOptionId] = useState(options[0]?.id ?? "");
  const [unit, setUnit] = useState<IdReceiptUnit>("BOX");
  const [descriptionCode, setDescriptionCode] = useState("");
  const [packsReceived, setPacksReceived] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("Main COC");
  const [dateReceived, setDateReceived] = useState(() =>
    formatManilaDateInput(new Date())
  );

  const selected = options.find((option) => option.id === itemOptionId) ?? options[0];
  const category = selected?.category ?? "ID_CARD";
  const choosesUnit =
    category === "ID_CARD" || category === "SLING_STUDENT" || category === "SLING_EMPLOYEE";
  const receiptUnit = choosesUnit ? unit : "BOX";
  const unitsPerPack =
    category === "SUPPLY"
      ? 1
      : receiptUnit === "PIECE"
        ? 1
        : category === "ID_CARD"
          ? cardsPerBox
          : slingsPerBundle;
  const packs = Number(packsReceived);
  const unitsAdded =
    Number.isFinite(packs) && packs > 0 ? Math.floor(packs) * unitsPerPack : 0;
  const preview = selected ? formatStockItemTitle(selected.name, descriptionCode) : "";
  const unitLabel = (value: IdReceiptUnit) =>
    category === "ID_CARD" ? ID_RECEIPT_UNIT_LABELS[value] : value === "PIECE" ? "Piece" : "Bundle";
  const quantityLabel =
    category === "SUPPLY"
      ? "Boxes received"
      : receiptUnit === "PIECE"
        ? "Pieces received"
        : category === "ID_CARD"
          ? "Boxes received"
          : "Bundles received";
  const addedLabel =
    category === "ID_CARD" ? "Cards added" : category === "SUPPLY" ? "Boxes added" : "Slings added";

  const hint = useMemo(() => {
    if (!selected) return "Add an item type in Settings before receiving stock.";
    if (category === "ID_CARD") {
      return receiptUnit === "PIECE"
        ? `A piece adds 1 ${selected.name}.`
        : `Each box adds ${formatCount(cardsPerBox)} ${selected.name}.`;
    }
    if (category === "SUPPLY") {
      return "Each box is counted as 1. This does not change ID card or sling stock.";
    }
    return receiptUnit === "PIECE"
      ? `A piece adds 1 ${selected.name}. Student and employee slings are tracked separately.`
      : `Each bundle adds ${formatCount(slingsPerBundle)} slings. Student and employee slings are tracked separately.`;
  }, [selected, category, receiptUnit, cardsPerBox, slingsPerBundle]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/id/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemOptionId: selected.id,
          unit: receiptUnit,
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
          {options.length === 0 ? (
            <Input id="itemType" value="Add an item type in Settings" readOnly />
          ) : options.length === 1 ? (
            <Input id="itemType" value={options[0]?.name ?? ""} readOnly />
          ) : (
            <Select
              value={selected?.id ?? ""}
              onValueChange={(value) => {
                if (value && options.some((option) => option.id === value)) {
                  setItemOptionId(value);
                }
              }}
            >
              <SelectTrigger id="itemType" className="w-full">
                <SelectValue>
                  {(value) =>
                    options.find((option) => option.id === value)?.name ?? "Item type"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {choosesUnit && selected ? (
          <div className="space-y-1.5">
            <Label htmlFor="receiptUnit">
              {category === "ID_CARD" ? "Box or piece" : "Bundle or piece"}
            </Label>
            <Select
              value={unit}
              onValueChange={(value) => {
                if (value === "BOX" || value === "PIECE") setUnit(value);
              }}
            >
              <SelectTrigger id="receiptUnit" className="w-full">
                <SelectValue>{(value) => unitLabel(value === "PIECE" ? "PIECE" : "BOX")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ID_RECEIPT_UNITS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {unitLabel(value)}
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
            placeholder={category === "SUPPLY" ? "3/22" : "29"}
            required
            disabled={!selected}
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
              disabled={!selected}
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
          disabled={loading || !selected}
        >
          <PackagePlus className="size-4" />
          {loading ? "Recording..." : "Record Stock Receipt"}
        </Button>
        <p className="text-center text-[11px] text-slate-500">{hint}</p>
      </form>
    </section>
  );
}
