"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { Download, FileSpreadsheet, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTableShell } from "@/components/responsive-table-shell";
import type { ReportRow } from "@/lib/reports";

function toInputDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function ReportsPage() {
  const [from, setFrom] = useState(toInputDate(subDays(new Date(), 30)));
  const [to, setTo] = useState(toInputDate(new Date()));
  const [studentId, setStudentId] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"xls" | "pdf" | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ from, to, format: "json" });
    if (studentId.trim()) params.set("studentId", studentId.trim());
    if (course.trim()) params.set("course", course.trim());
    if (status !== "all") params.set("status", status);
    return params.toString();
  }, [from, to, studentId, course, status]);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/attendance?${queryString}`);
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to load report");
        return;
      }
      setRows(data.rows ?? []);
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const timeout = setTimeout(loadPreview, 300);
    return () => clearTimeout(timeout);
  }, [loadPreview]);

  async function downloadReport(formatType: "xls" | "pdf") {
    setExporting(formatType);
    try {
      const params = new URLSearchParams({ from, to, format: formatType });
      if (studentId.trim()) params.set("studentId", studentId.trim());
      if (course.trim()) params.set("course", course.trim());
      if (status !== "all") params.set("status", status);

      const response = await fetch(`/api/reports/attendance?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Export failed");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ??
        `attendance-report.${formatType === "xls" ? "xls" : "pdf"}`;

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
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Export attendance records to Excel or PDF
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => downloadReport("xls")}
            disabled={exporting !== null}
          >
            <FileSpreadsheet className="size-4" />
            {exporting === "xls" ? "Exporting..." : "Export Excel"}
          </Button>
          <Button
            onClick={() => downloadReport("pdf")}
            disabled={exporting !== null}
          >
            <FileText className="size-4" />
            {exporting === "pdf" ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="2024-001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Input
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="BS IT"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="in_only">Timed in only</SelectItem>
                <SelectItem value="not_yet">Not yet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Preview {loading ? "" : `(${rows.length} records)`}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadPreview}>
            <Search className="size-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {!loading && rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No records match your filters. Try a wider date range.
            </p>
          ) : (
            <ResponsiveTableShell minWidthClassName="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time In</TableHead>
                    <TableHead>Time Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((row, index) => (
                    <TableRow key={`${row.studentId}-${row.date}-${index}`}>
                      <TableCell className="font-medium">
                        {row.firstName} {row.lastName}
                      </TableCell>
                      <TableCell>{row.studentId}</TableCell>
                      <TableCell>{row.course || "—"}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.timeIn}</TableCell>
                      <TableCell>{row.timeOut}</TableCell>
                      <TableCell>{row.duration}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            </ResponsiveTableShell>
          )}
          {rows.length > 50 && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Download className="size-3" />
              Showing first 50 rows. Export to see all {rows.length} records.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
