"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, ImageDown, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DailyMonitoringReport } from "@/components/daily-monitoring-report";
import { downloadMonitoringReportAsPng } from "@/lib/download-element-image";
import type { MonitoringEntryDto, MonitoringReportDto } from "@/lib/monitoring";
import type { MonitoringShift } from "@/lib/monitoring-systems";

function toInputDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function buildSnapshot(entries: MonitoringEntryDto[], shiftType: MonitoringShift) {
  return JSON.stringify({ entries, shiftType });
}

export default function MonitoringReportPage() {
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") ?? toInputDate(new Date());
  const [date, setDate] = useState(initialDate);
  const [shiftType, setShiftType] = useState<MonitoringShift>("IN");
  const [entries, setEntries] = useState<MonitoringEntryDto[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);

  const isDirty = savedSnapshot !== buildSnapshot(entries, shiftType);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/monitoring?date=${date}`);
      const data = (await response.json()) as MonitoringReportDto & {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Failed to load report");
        return;
      }

      setEntries(data.entries ?? []);
      setShiftType(data.shiftType ?? "IN");
      setSavedSnapshot(buildSnapshot(data.entries ?? [], data.shiftType ?? "IN"));
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    const queryDate = searchParams.get("date");
    if (queryDate && queryDate !== date) {
      setDate(queryDate);
    }
  }, [searchParams, date]);

  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function handleEntryChange(
    systemId: string,
    field: keyof Omit<
      MonitoringEntryDto,
      "id" | "systemName" | "category" | "sortOrder"
    >,
    value: string
  ) {
    setEntries((current) =>
      current.map((entry) =>
        entry.systemId === systemId ? { ...entry, [field]: value } : entry
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch("/api/monitoring", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          shiftType,
          entries: entries.map((entry) => ({
            systemId: entry.systemId,
            status: entry.status,
            accountNo: entry.accountNo,
            uptime: entry.uptime,
            downtime: entry.downtime,
            restoration: entry.restoration,
            userExperience: entry.userExperience,
            remarks: entry.remarks,
          })),
        }),
      });

      const data = (await response.json()) as MonitoringReportDto & {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Failed to save report");
        return;
      }

      setEntries(data.entries ?? []);
      setShiftType(data.shiftType ?? "IN");
      setSavedSnapshot(buildSnapshot(data.entries ?? [], data.shiftType ?? "IN"));
      toast.success("Report saved");
    } catch {
      toast.error("Failed to save report");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/monitoring/export?date=${date}&format=xls`
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Export failed");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ?? `daily-monitoring_${date}.xls`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadImage() {
    if (entries.length === 0) {
      toast.error("Report is not ready to capture");
      return;
    }

    setDownloadingImage(true);
    try {
      const filename = `daily-monitoring_${date}_${shiftType}.png`;
      await downloadMonitoringReportAsPng(
        {
          reportDate: date,
          shiftType,
          entries: entries.map((entry) => ({
            systemName: entry.systemName,
            category: entry.category,
            sortOrder: entry.sortOrder,
            status: entry.status,
            accountNo: entry.accountNo,
            uptime: entry.uptime,
            downtime: entry.downtime,
            restoration: entry.restoration,
            userExperience: entry.userExperience,
            remarks: entry.remarks,
          })),
        },
        { filename }
      );
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error("Image download failed:", error);
      toast.error("Image download failed");
    } finally {
      setDownloadingImage(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Daily Monitoring Report
          </h1>
          <p className="text-sm text-muted-foreground">
            IT systems status and user experience for COC-ILIGAN
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadImage}
            disabled={loading || downloadingImage || saving || exporting}
          >
            <ImageDown className="size-4" />
            {downloadingImage ? "Capturing..." : "Download Image"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={loading || exporting || saving || downloadingImage}
          >
            <FileSpreadsheet className="size-4" />
            {exporting ? "Exporting..." : "Export Excel"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saving || exporting || !isDirty || downloadingImage}
          >
            <Save className="size-4" />
            {saving ? "Saving..." : "Save report"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="report-date">Report date</Label>
            <Input
              id="report-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <p className="text-sm text-muted-foreground">
              {isDirty
                ? "You have unsaved changes."
                : "All changes saved for this date."}
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading report...
          </CardContent>
        </Card>
      ) : (
        <DailyMonitoringReport
          reportDate={date}
          shiftType={shiftType}
          entries={entries}
          onShiftChange={setShiftType}
          onEntryChange={handleEntryChange}
        />
      )}
    </div>
  );
}
