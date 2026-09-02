"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { Input } from "@/components/ui/input";
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
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { AttendanceRateBadge } from "@/components/attendance-rate-badge";
import {
  AttendanceTallyPair,
} from "@/components/attendance-tally-badge";
import { ResponsiveTableShell } from "@/components/responsive-table-shell";
import {
  REQUIRED_DUTY_HOURS,
  type AttendanceRate,
} from "@/lib/attendance-stats";
import {
  getStudentAssignmentLabel,
  type StudentAssignment,
} from "@/lib/student-assignment";
import type { StudentType } from "@/lib/student-type";

type StatusFilter = "active" | "inactive" | "all";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Deactivated" },
  { value: "all", label: "All students" },
];

function parseStatusFilter(value: string | null): StatusFilter {
  if (value === "inactive" || value === "all") return value;
  return "active";
}

type StudentStats = {
  lateCount: number;
  absentCount: number;
  hoursCompleted: number;
  dutyProgressPercent: number;
  rate: AttendanceRate | null;
  rateLabel: string;
};

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
  stats: StudentStats;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [canFilterDeactivated, setCanFilterDeactivated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth");
        if (!response.ok) return;
        const data = await response.json();
        setCanFilterDeactivated(data.role === "SUPER_ADMIN");
      } catch {
        setCanFilterDeactivated(false);
      }
    }

    void loadSession();
  }, []);

  useEffect(() => {
    if (!canFilterDeactivated && statusFilter !== "active") {
      setStatusFilter("active");
    }
  }, [canFilterDeactivated, statusFilter]);

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (canFilterDeactivated && statusFilter !== "active") {
        params.set("status", statusFilter);
      }
      const response = await fetch(`/api/students?${params.toString()}`);
      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
      setLoading(false);
    }

    const timeout = setTimeout(loadStudents, 300);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, canFilterDeactivated]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading students...";
    const noun =
      statusFilter === "inactive"
        ? "deactivated student"
        : "student";
    return `${students.length} ${noun}${students.length === 1 ? "" : "s"}`;
  }, [students.length, loading, statusFilter]);

  const emptyMessage =
    statusFilter === "inactive"
      ? "No deactivated students found."
      : search
        ? "No students found."
        : "No students found. Register your first student to get started.";

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or course..."
            className="pl-9"
          />
        </div>
        {canFilterDeactivated ? (
          <Select
            value={statusFilter}
            items={STATUS_OPTIONS}
            onValueChange={(value) =>
              setStatusFilter(parseStatusFilter(value ?? "active"))
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {!loading && students.length === 0 ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
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
                    <p className="mb-1.5 text-xs text-muted-foreground">
                      Attendance record
                    </p>
                    <AttendanceTallyPair
                      lateCount={student.stats?.lateCount ?? 0}
                      absentCount={student.stats?.absentCount ?? 0}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duty hours</p>
                    <p className="font-medium tabular-nums">
                      {student.stats?.hoursCompleted ?? 0}/{REQUIRED_DUTY_HOURS}{" "}
                      hr
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <AttendanceRateBadge
                      rate={student.stats?.rate ?? null}
                      rateLabel={student.stats?.rateLabel}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <ResponsiveTableShell className="hidden md:block" minWidthClassName="min-w-[1280px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Late / Absent</TableHead>
                  <TableHead>Duty Hours</TableHead>
                  <TableHead>Rate</TableHead>
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
                    <TableCell>
                      <Badge variant="outline">{student.studentType}</Badge>
                    </TableCell>
                    <TableCell>
                      <AttendanceTallyPair
                        lateCount={student.stats?.lateCount ?? 0}
                        absentCount={student.stats?.absentCount ?? 0}
                        compact
                      />
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {student.stats?.hoursCompleted ?? 0}/{REQUIRED_DUTY_HOURS}{" "}
                      hr
                      <span className="ml-1 font-normal text-muted-foreground">
                        ({student.stats?.dutyProgressPercent ?? 0}%)
                      </span>
                    </TableCell>
                    <TableCell>
                      <AttendanceRateBadge
                        rate={student.stats?.rate ?? null}
                        rateLabel={student.stats?.rateLabel}
                      />
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
