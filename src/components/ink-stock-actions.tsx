"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function InkClearStockButton({
  modelName,
  label,
  confirmMessage,
  endpoint,
  variant = "outline",
}: {
  modelName?: string;
  label: string;
  confirmMessage: string;
  endpoint?: string;
  variant?: "outline" | "ghost";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const response = await fetch(endpoint ?? "/api/inventory/inks/stock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: endpoint ? undefined : JSON.stringify(modelName ? { modelName } : {}),
      });
      const data = (await response.json().catch(() => ({}))) as {
        cleared?: number;
        removed?: boolean;
        error?: string;
      };
      if (!response.ok) {
        toast.error(data.error ?? "Could not clear available ink");
        return;
      }
      if (data.removed) {
        toast.success("Release removed");
      } else {
        const count = data.cleared ?? 0;
        toast.success(count === 1 ? "Cleared 1 available bottle" : `Cleared ${count} available bottles`);
      }
      router.refresh();
    } catch {
      toast.error("Could not clear available ink");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={handleClick} disabled={loading}>
      {loading ? "Clearing..." : label}
    </Button>
  );
}
