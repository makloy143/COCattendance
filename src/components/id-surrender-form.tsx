"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IdStudentLookup } from "@/components/id-student-lookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatManilaDateInput } from "@/lib/date-utils";

export function IdSurrenderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [personName, setPersonName] = useState("");
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [surrenderDate, setSurrenderDate] = useState(() => formatManilaDateInput(new Date()));
  const [idCardsReturned, setIdCardsReturned] = useState("1");
  const [slingsReturned, setSlingsReturned] = useState("1");
  const [receivedBy, setReceivedBy] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/id/surrenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName,
          course,
          yearLevel,
          idNumber,
          surrenderDate,
          idCardsReturned,
          slingsReturned,
          receivedBy,
          studentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to record withdrawal");
        return;
      }
      toast.success("Withdrawal recorded. The ID and sling are back in stock.");
      setPersonName("");
      setCourse("");
      setYearLevel("");
      setIdNumber("");
      setStudentId("");
      setReceivedBy("");
      router.refresh();
    } catch {
      toast.error("Failed to record withdrawal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-base font-semibold">Student withdrawal</h2>
        <p className="mt-1 text-sm text-slate-600">
          Record the student who withdrew and turned in an ID card and sling.
          Returned cards and student slings go back into stock.
        </p>
      </div>
      <IdStudentLookup
        onSelect={(student) => {
          setPersonName(`${student.firstName} ${student.lastName}`.trim());
          setCourse(student.course ?? "");
          setYearLevel(student.yearLevel ?? "");
          setIdNumber(student.studentId);
          setStudentId(student.id);
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="surrenderName">Name</Label>
          <Input id="surrenderName" value={personName} onChange={(event) => setPersonName(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="surrenderCourse">Course</Label>
          <Input id="surrenderCourse" value={course} onChange={(event) => setCourse(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="surrenderYear">Year level</Label>
          <Input id="surrenderYear" value={yearLevel} onChange={(event) => setYearLevel(event.target.value)} placeholder="1st Year" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="surrenderIdNumber">ID #</Label>
          <Input id="surrenderIdNumber" value={idNumber} onChange={(event) => setIdNumber(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="surrenderDate">Date surrendered</Label>
          <Input id="surrenderDate" type="date" value={surrenderDate} onChange={(event) => setSurrenderDate(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="receivedBy">Received by</Label>
          <Input id="receivedBy" value={receivedBy} onChange={(event) => setReceivedBy(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="idCardsReturned">ID cards returned</Label>
          <Input id="idCardsReturned" inputMode="numeric" value={idCardsReturned} onChange={(event) => setIdCardsReturned(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slingsReturned">Student slings returned</Label>
          <Input id="slingsReturned" inputMode="numeric" value={slingsReturned} onChange={(event) => setSlingsReturned(event.target.value)} required />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="bg-[#0e6b43] text-white hover:bg-[#0c5b39]">
        {loading ? "Saving..." : "Save withdrawal"}
      </Button>
    </form>
  );
}
