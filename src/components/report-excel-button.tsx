"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ReportExcelButton({
  endpoint,
  period,
}: {
  endpoint: string;
  period: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const response = await fetch(`${endpoint}?period=${encodeURIComponent(period)}`);
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Could not download the report");
        return;
      }
      const blob = await response.blob();
      const filename =
        response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ??
        "report.xls";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Excel report downloaded");
    } catch {
      toast.error("Could not download the report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" className="cursor-pointer" onClick={() => void handleClick()} disabled={loading}>
      <FileSpreadsheet className="size-4" />
      {loading ? "Downloading..." : "Download Excel"}
    </Button>
  );
}
