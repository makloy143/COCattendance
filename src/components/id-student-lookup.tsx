"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StudentResult = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  course: string | null;
};

export function IdStudentLookup({
  onSelect,
}: {
  onSelect: (student: StudentResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [resultQuery, setResultQuery] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      const response = await fetch(
        `/api/inventory/students/search?q=${encodeURIComponent(trimmed)}`
      );
      if (!response.ok || cancelled) return;
      const data = (await response.json()) as StudentResult[];
      if (cancelled) return;
      setResults(Array.isArray(data) ? data : []);
      setResultQuery(trimmed);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const visibleResults = query.trim().length >= 2 && query.trim() === resultQuery ? results : [];

  return (
    <div className="space-y-1.5">
      <Label htmlFor="studentLookup">Find student (optional)</Label>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          id="studentLookup"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or ID number"
          className="pl-9"
        />
      </div>
      {visibleResults.length > 0 ? (
        <div className="overflow-hidden rounded-lg border bg-white">
          {visibleResults.map((student) => (
            <button
              key={student.id}
              type="button"
              className="flex w-full flex-col items-start border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50"
              onClick={() => {
                onSelect(student);
                setQuery("");
                setResults([]);
              }}
            >
              <span className="font-medium">
                {student.firstName} {student.lastName}
              </span>
              <span className="text-xs text-slate-500">
                {student.studentId}
                {student.course ? ` · ${student.course}` : ""}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
