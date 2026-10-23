"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IdStudentLookup } from "@/components/id-student-lookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatManilaDateInput } from "@/lib/date-utils";
import { ID_BAD_PRINT_REASON_PRESETS } from "@/lib/id-maintenance";

export function IdBadPrintForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [personName, setPersonName] = useState("");
  const [course, setCourse] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [datePrinted, setDatePrinted] = useState(() => formatManilaDateInput(new Date()));
  const [reason, setReason] = useState<(typeof ID_BAD_PRINT_REASON_PRESETS)[number]>("CARD JAM");
  const [quantity, setQuantity] = useState("1");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/id/bad-prints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName,
          course,
          idNumber,
          datePrinted,
          status: "REPRINT",
          reason,
          quantity,
          studentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to record bad printing");
        return;
      }
      toast.success("Bad printing recorded");
      setPersonName("");
      setCourse("");
      setIdNumber("");
      setStudentId("");
      setQuantity("1");
      router.refresh();
    } catch {
      toast.error("Failed to record bad printing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-base font-semibold">Record bad printing</h2>
        <p className="mt-1 text-sm text-slate-600">
          Quantity is the number of physical cards wasted. That quantity is
          deducted from ID card stock. If a replacement card is printed later,
          record it as an ID release and set how many new cards were used.
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
        <div className="space-y-1.5">
          <Label htmlFor="badName">Name</Label>
          <Input id="badName" value={personName} onChange={(event) => setPersonName(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="badCourse">Course</Label>
          <Input id="badCourse" value={course} onChange={(event) => setCourse(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="badIdNumber">ID #</Label>
          <Input id="badIdNumber" value={idNumber} onChange={(event) => setIdNumber(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="datePrinted">Date printed</Label>
          <Input id="datePrinted" type="date" value={datePrinted} onChange={(event) => setDatePrinted(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="badReason">Category</Label>
          <select
            id="badReason"
            value={reason}
            onChange={(event) => {
              const next = ID_BAD_PRINT_REASON_PRESETS.find((item) => item === event.target.value);
              if (next) setReason(next);
            }}
            className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            required
          >
            {ID_BAD_PRINT_REASON_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity wasted</Label>
          <Input id="quantity" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="bg-[#0e6b43] text-white hover:bg-[#0c5b39]">
        {loading ? "Saving..." : "Save bad printing"}
      </Button>
    </form>
  );
}
