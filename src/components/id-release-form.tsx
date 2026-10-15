"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IdStudentLookup } from "@/components/id-student-lookup";
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
  ID_RELEASE_REASON_PRESETS,
  ID_RELEASE_STATUSES,
  ID_RELEASE_STATUS_LABELS,
  type IdReleaseStatus,
} from "@/lib/id-maintenance";

export function IdReleaseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [personName, setPersonName] = useState("");
  const [course, setCourse] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [transactionDate, setTransactionDate] = useState(() =>
    formatManilaDateInput(new Date())
  );
  const [status, setStatus] = useState<IdReleaseStatus>("NEW_ID");
  const [reason, setReason] = useState("NEW ENROLLMENT");
  const [printedBy, setPrintedBy] = useState("");
  const [idCardsUsed, setIdCardsUsed] = useState("1");
  const [slingsUsed, setSlingsUsed] = useState("1");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/id/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName,
          course,
          idNumber,
          transactionDate,
          status,
          reason,
          printedBy,
          idCardsUsed,
          slingsUsed,
          studentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to record release");
        return;
      }
      toast.success("ID release recorded");
      setPersonName("");
      setCourse("");
      setIdNumber("");
      setStudentId("");
      setPrintedBy("");
      router.refresh();
    } catch {
      toast.error("Failed to record release");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-base font-semibold">Record ID release</h2>
        <p className="mt-1 text-sm text-slate-600">
          Stock drops only by the ID cards used and slings used on this row. A
          reprint status does not waste a card by itself. Record damaged cards
          on Bad Printing.
        </p>
      </div>
      <IdStudentLookup
        onSelect={(student) => {
          setPersonName(`${student.firstName} ${student.lastName}`.trim());
          setCourse(student.course ?? "");
          setIdNumber(student.studentId);
          setStudentId(student.id);
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="personName">Name</Label>
          <Input id="personName" value={personName} onChange={(event) => setPersonName(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="course">Course</Label>
          <Input id="course" value={course} onChange={(event) => setCourse(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="idNumber">ID #</Label>
          <Input id="idNumber" value={idNumber} onChange={(event) => setIdNumber(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="transactionDate">Date</Label>
          <Input id="transactionDate" type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="releaseStatus">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              if (value === "NEW_ID" || value === "REPRINT") setStatus(value);
            }}
          >
            <SelectTrigger id="releaseStatus" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ID_RELEASE_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {ID_RELEASE_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason / transaction</Label>
          <Input id="reason" list="release-reasons" value={reason} onChange={(event) => setReason(event.target.value)} required />
          <datalist id="release-reasons">
            {ID_RELEASE_REASON_PRESETS.map((preset) => (
              <option key={preset} value={preset} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="printedBy">Printed by</Label>
          <Input id="printedBy" value={printedBy} onChange={(event) => setPrintedBy(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="idCardsUsed">ID cards used</Label>
          <Input id="idCardsUsed" inputMode="numeric" value={idCardsUsed} onChange={(event) => setIdCardsUsed(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slingsUsed">Slings used</Label>
          <Input id="slingsUsed" inputMode="numeric" value={slingsUsed} onChange={(event) => setSlingsUsed(event.target.value)} required />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="bg-[#0e6b43] text-white hover:bg-[#0c5b39]">
        {loading ? "Saving..." : "Save release"}
      </Button>
    </form>
  );
}
