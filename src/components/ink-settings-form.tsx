"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InkSettingsForm({ lowStockAtMost }: { lowStockAtMost: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(String(lowStockAtMost));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/inks/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lowStockAtMost: value }),
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
      <div className="space-y-1.5">
        <Label htmlFor="lowStockAtMost">Low stock bottles</Label>
        <Input
          id="lowStockAtMost"
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
        />
      </div>
      <p className="text-sm text-slate-600">
        A model is marked low stock after it has been received and the remaining
        bottles are at or below this number. An empty model is not low stock.
      </p>
      <Button type="submit" disabled={loading} className="bg-[#0e6b43] text-white hover:bg-[#0c5b39]">
        {loading ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
