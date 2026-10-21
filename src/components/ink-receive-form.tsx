"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatManilaDateInput } from "@/lib/date-utils";
import { DEPARTMENTS, type InkColor } from "@/lib/inventory";

export function InkReceiveForm({
  models,
}: {
  models: { name: string; inkColor: InkColor }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itemName, setItemName] = useState(models[0]?.name ?? "");
  const [quantity, setQuantity] = useState("");
  const [senderName, setSenderName] = useState("");
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [departments, setDepartments] = useState<string[]>([...DEPARTMENTS]);
  const [dateReceived, setDateReceived] = useState(() => formatManilaDateInput(new Date()));
  const selected = models.find((model) => model.name === itemName) ?? models[0];

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/inventory/departments")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as unknown;
        if (!cancelled && Array.isArray(data) && data.every((item) => typeof item === "string") && data.length > 0) {
          setDepartments(data);
          setDepartment((current) => (data.includes(current) ? current : data[0]));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/received", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: selected.name,
          itemType: "CONSUMABLE",
          category: "INK",
          inkColor: selected.inkColor,
          model: selected.name.split(" ").slice(1).join(" "),
          quantity,
          senderName,
          senderSource: "COC Main",
          receivedByDepartment: department,
          dateReceived,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to record ink");
        return;
      }
      toast.success(`Received ${quantity} ${selected.name}`);
      setQuantity("");
      setSenderName("");
      router.refresh();
    } catch {
      toast.error("Failed to record ink");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#0e6b43]/20 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-[#0e6b43] px-4 py-3 text-white">
        <PackagePlus className="size-4" />
        <h2 className="text-sm font-semibold sm:text-base">Receive ink from Main COC</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="inkModel">Ink model</Label>
          <select
            id="inkModel"
            value={selected?.name ?? ""}
            onChange={(event) => setItemName(event.target.value)}
            className="h-10 w-full rounded-md border bg-white px-3 text-sm"
          >
            {models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
            {models.length === 0 ? <option value="">Add a model in Settings</option> : null}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inkQuantity">Bottles received</Label>
          <Input
            id="inkQuantity"
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="6"
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="inkDate">Date received</Label>
            <Input
              id="inkDate"
              type="date"
              value={dateReceived}
              onChange={(event) => setDateReceived(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inkDepartment">Department</Label>
            <select
              id="inkDepartment"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            >
              {departments.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inkReceivedBy">Received by</Label>
          <Input
            id="inkReceivedBy"
            value={senderName}
            onChange={(event) => setSenderName(event.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="h-10 w-full bg-[#0e6b43] text-white hover:bg-[#0c5b39]"
          disabled={loading || !selected}
        >
          <PackagePlus className="size-4" />
          {loading ? "Recording..." : "Record ink receipt"}
        </Button>
        <p className="text-center text-[11px] text-slate-500">
          Each bottle is counted as 1. Releasing ink later reduces that model&apos;s balance.
        </p>
      </form>
    </section>
  );
}
