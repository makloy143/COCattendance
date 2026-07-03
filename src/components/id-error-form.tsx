"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ID_ERROR_REASON_PRESETS } from "@/lib/inventory";
import type { IdErrorRecordFormValues } from "@/lib/validations";

type StudentResult = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  course: string | null;
};

const emptyValues: IdErrorRecordFormValues = {
  personName: "",
  course: "",
  idNumber: "",
  datePrintedError: format(new Date(), "yyyy-MM-dd"),
  status: "REPRINT",
  reason: "",
  notes: "",
  studentId: "",
};

export function IdErrorForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<IdErrorRecordFormValues>(emptyValues);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (studentQuery.length < 2) {
      setStudentResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const response = await fetch(
        `/api/inventory/students/search?q=${encodeURIComponent(studentQuery)}`
      );
      const data = await response.json();
      setStudentResults(data);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [studentQuery]);

  function updateField<K extends keyof IdErrorRecordFormValues>(
    field: K,
    value: IdErrorRecordFormValues[K]
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function selectStudent(student: StudentResult) {
    setValues((current) => ({
      ...current,
      personName: `${student.firstName} ${student.lastName}`.trim(),
      course: student.course ?? "",
      idNumber: student.studentId,
      studentId: student.id,
    }));
    setStudentQuery("");
    setStudentResults([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/inventory/id-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to save ID error record");
        return;
      }

      toast.success("ID error logged");
      router.push("/inventory/id-errors");
      router.refresh();
    } catch {
      toast.error("Failed to save ID error record");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader>
          <CardTitle>Student lookup (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Search by name or ID number..."
              className="pl-9"
            />
          </div>
          {searching && (
            <p className="text-xs text-muted-foreground">Searching...</p>
          )}
          {studentResults.length > 0 && (
            <div className="rounded-lg border bg-background">
              {studentResults.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                  onClick={() => selectStudent(student)}
                >
                  <span className="font-medium">
                    {student.firstName} {student.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {student.studentId}
                    {student.course ? ` · ${student.course}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Or enter details manually below.
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-yellow-500/60">
        <CardHeader>
          <CardTitle>Error details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="personName">Name</Label>
            <Input
              id="personName"
              value={values.personName}
              onChange={(e) => updateField("personName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Input
              id="course"
              value={values.course}
              onChange={(e) => updateField("course", e.target.value)}
              placeholder="e.g. BSN, FACULTY"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idNumber">ID #</Label>
            <Input
              id="idNumber"
              value={values.idNumber}
              onChange={(e) => updateField("idNumber", e.target.value)}
              placeholder="e.g. 02-2526-032594"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="datePrintedError">Date printed error</Label>
            <Input
              id="datePrintedError"
              type="date"
              value={values.datePrintedError}
              onChange={(e) => updateField("datePrintedError", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={values.status}
              onValueChange={(v) => {
                if (v === "REPRINT" || v === "RESOLVED" || v === "CANCELLED") {
                  updateField("status", v);
                }
              }}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REPRINT">Reprint</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={values.reason}
              onChange={(e) => updateField("reason", e.target.value)}
              placeholder="Reason for reprint"
              required
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ID_ERROR_REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="rounded-md border px-2 py-0.5 text-xs hover:bg-muted"
                  onClick={() => updateField("reason", preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Log ID error"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/inventory/id-errors")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
