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
  ID_SLING_KIND_LABELS,
  ID_SLING_KINDS,
  type IdSlingKind,
} from "@/lib/id-maintenance";

const SLING_REASON_PRESETS = [...ID_RELEASE_REASON_PRESETS, "LOST SLING"] as const;

export function IdSlingReleaseForm({
  studentRemaining,
  employeeRemaining,
}: {
  studentRemaining: number;
  employeeRemaining: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [personName, setPersonName] = useState("");
  const [course, setCourse] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [transactionDate, setTransactionDate] = useState(() => formatManilaDateInput(new Date()));
  const [reason, setReason] = useState("NEW ENROLLMENT");
  const [releasedBy, setReleasedBy] = useState("");
  const [slingsUsed, setSlingsUsed] = useState("1");
  const [slingKind, setSlingKind] = useState<IdSlingKind>("STUDENT");
  const remaining = slingKind === "EMPLOYEE" ? employeeRemaining : studentRemaining;

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
          status: "SLING",
          reason,
          printedBy: releasedBy,
          idCardsUsed: 0,
          pvcCardId: "",
          slingsUsed,
          slingKind,
          studentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to record sling release");
        return;
      }
      toast.success("Sling release recorded");
      setPersonName("");
      setCourse("");
      setIdNumber("");
      setStudentId("");
      setReleasedBy("");
      setSlingsUsed("1");
      router.refresh();
    } catch {
      toast.error("Failed to record sling release");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-base font-semibold">Record sling release</h2>
        <p className="mt-1 text-sm text-slate-600">
          This uses a sling only. It does not take a PVC card. Student and employee slings stay in separate stock.
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
          <Label htmlFor="slingPersonName">Name</Label>
          <Input id="slingPersonName" value={personName} onChange={(event) => setPersonName(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slingCourse">Course</Label>
          <Input id="slingCourse" value={course} onChange={(event) => setCourse(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slingIdNumber">ID #</Label>
          <Input id="slingIdNumber" value={idNumber} onChange={(event) => setIdNumber(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slingDate">Date</Label>
          <Input id="slingDate" type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slingReason">Reason</Label>
          <Input id="slingReason" list="sling-release-reasons" value={reason} onChange={(event) => setReason(event.target.value)} required />
          <datalist id="sling-release-reasons">
            {SLING_REASON_PRESETS.map((preset) => (
              <option key={preset} value={preset} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="releasedBy">Released by</Label>
          <Input id="releasedBy" value={releasedBy} onChange={(event) => setReleasedBy(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slingQuantity">Slings used</Label>
          <Input id="slingQuantity" inputMode="numeric" value={slingsUsed} onChange={(event) => setSlingsUsed(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slingReleaseKind">Sling for</Label>
          <Select
            value={slingKind}
            onValueChange={(value) => {
              if (value === "STUDENT" || value === "EMPLOYEE") setSlingKind(value);
            }}
          >
            <SelectTrigger id="slingReleaseKind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ID_SLING_KINDS.map((value) => (
                <SelectItem key={value} value={value}>
                  {ID_SLING_KIND_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            {ID_SLING_KIND_LABELS[slingKind]} slings left: {remaining.toLocaleString("en-US")}
          </p>
        </div>
      </div>
      <Button type="submit" disabled={loading} className="bg-[#0e6b43] text-white hover:bg-[#0c5b39]">
        {loading ? "Saving..." : "Save sling release"}
      </Button>
    </form>
  );
}
