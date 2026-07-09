"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTableShell } from "@/components/responsive-table-shell";
import {
  getStudentAssignmentLabel,
  type StudentAssignment,
} from "@/lib/student-assignment";
import { formatTotalHours } from "@/lib/date-utils";
import type { StudentType } from "@/lib/student-type";

type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  course: string | null;
  yearLevel: string | null;
  studentType: StudentType;
  assignment: StudentAssignment;
  photoUrl: string | null;
  isActive: boolean;
  totalMinutes: number;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const response = await fetch(`/api/students?${params.toString()}`);
      const data = await response.json();
      setStudents(data);
      setLoading(false);
    }

    const timeout = setTimeout(loadStudents, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading students...";
    return `${students.length} student${students.length === 1 ? "" : "s"}`;
  }, [students.length, loading]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Students</h1>
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        </div>
        <ButtonLink href="/students/new">
          <Plus className="size-4" />
          Add Student
        </ButtonLink>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, or course..."
          className="pl-9"
        />
      </div>

      {!loading && students.length === 0 ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          No students found. Register your first student to get started.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className="block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <StudentAvatar
                    photoUrl={student.photoUrl}
                    firstName={student.firstName}
                    lastName={student.lastName}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.studentId}
                    </p>
                  </div>
                  <Badge variant={student.isActive ? "secondary" : "outline"}>
                    {student.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Course</p>
                    <p className="truncate">{student.course || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Year</p>
                    <p>{student.yearLevel || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge variant="outline">{student.studentType}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assign to</p>
                    <p className="truncate">
                      {getStudentAssignmentLabel(student.assignment)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Total hours</p>
                    <p className="font-medium">
                      {formatTotalHours(student.totalMinutes ?? 0)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <ResponsiveTableShell className="hidden md:block" minWidthClassName="min-w-[1080px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assign to</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link
                        href={`/students/${student.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <StudentAvatar
                          photoUrl={student.photoUrl}
                          firstName={student.firstName}
                          lastName={student.lastName}
                          size="sm"
                        />
                        <span className="font-medium">
                          {student.firstName} {student.lastName}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.course || "—"}</TableCell>
                    <TableCell>{student.yearLevel || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.studentType}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStudentAssignmentLabel(student.assignment)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatTotalHours(student.totalMinutes ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.isActive ? "secondary" : "outline"}>
                        {student.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTableShell>
        </>
      )}
    </div>
  );
}
