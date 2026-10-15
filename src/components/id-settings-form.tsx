"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IdSettingsForm({
  cardsPerBox,
  slingsPerBundle,
  lowIdCardThreshold,
  lowSlingThreshold,
}: {
  cardsPerBox: number;
  slingsPerBundle: number;
  lowIdCardThreshold: number;
  lowSlingThreshold: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    cardsPerBox: String(cardsPerBox),
    slingsPerBundle: String(slingsPerBundle),
    lowIdCardThreshold: String(lowIdCardThreshold),
    lowSlingThreshold: String(lowSlingThreshold),
  });

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/id/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to save settings");
        return;
      }
      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cardsPerBox">Cards per box</Label>
          <Input
            id="cardsPerBox"
            inputMode="numeric"
            value={values.cardsPerBox}
            onChange={(event) => update("cardsPerBox", event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slingsPerBundle">Slings per bundle</Label>
          <Input
            id="slingsPerBundle"
            inputMode="numeric"
            value={values.slingsPerBundle}
            onChange={(event) => update("slingsPerBundle", event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lowIdCardThreshold">Low ID card stock</Label>
          <Input
            id="lowIdCardThreshold"
            inputMode="numeric"
            value={values.lowIdCardThreshold}
            onChange={(event) => update("lowIdCardThreshold", event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lowSlingThreshold">Low sling stock</Label>
          <Input
            id="lowSlingThreshold"
            inputMode="numeric"
            value={values.lowSlingThreshold}
            onChange={(event) => update("lowSlingThreshold", event.target.value)}
            required
          />
        </div>
      </div>
      <p className="text-sm text-slate-600">
        Pack size applies to the next receipt. Receipts already saved keep the
        cards or slings they added. Low stock badges appear when the current
        balance is at or below these amounts.
      </p>
      <Button type="submit" disabled={loading} className="bg-[#0e6b43] text-white hover:bg-[#0c5b39]">
        {loading ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
