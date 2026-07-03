"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
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
import { AttendanceStatusBadge } from "@/components/attendance-status-badge";
import { AttendanceActions } from "@/components/attendance-actions";
import { ResponsiveTableShell } from "@/components/responsive-table-shell";
import { formatDuration, formatTime } from "@/lib/date-utils";

type TodayStudent = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  todayRecord: {
    timeIn: string | null;
    timeOut: string | null;
  } | null;
};

export default function AttendancePage() {
  const [students, setStudents] = useState<TodayStudent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAttendance() {
    setLoading(true);
    const response = await fetch("/api/attendance?today=true");
    const data = await response.json();
    setStudents(data);
    setLoading(false);
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (student) =>
        student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query)
    );
  }, [students, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Today&apos;s Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          Record time in and time out for all active students
        </p>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..."
          className="pl-9"
        />
      </div>

      {!loading && filtered.length === 0 ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          No students found.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((student) => (
              <div
                key={student.id}
                className="space-y-4 rounded-xl border bg-card p-4"
              >
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
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.studentId}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center justify-between gap-2">
                  <AttendanceStatusBadge
                    timeIn={student.todayRecord?.timeIn}
                    timeOut={student.todayRecord?.timeOut}
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatDuration(
                      student.todayRecord?.timeIn,
                      student.todayRecord?.timeOut
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Time In</p>
                    <p className="font-medium">
                      {formatTime(student.todayRecord?.timeIn)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time Out</p>
                    <p className="font-medium">
                      {formatTime(student.todayRecord?.timeOut)}
                    </p>
                  </div>
                </div>

                <AttendanceActions
                  studentId={student.id}
                  timeIn={student.todayRecord?.timeIn}
                  timeOut={student.todayRecord?.timeOut}
                  onUpdate={loadAttendance}
                  compact
                  fullWidth
                />
              </div>
            ))}
          </div>

          <ResponsiveTableShell className="hidden md:block" minWidthClassName="min-w-[880px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
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
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.studentId}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <AttendanceStatusBadge
                        timeIn={student.todayRecord?.timeIn}
                        timeOut={student.todayRecord?.timeOut}
                      />
                    </TableCell>
                    <TableCell>{formatTime(student.todayRecord?.timeIn)}</TableCell>
                    <TableCell>{formatTime(student.todayRecord?.timeOut)}</TableCell>
                    <TableCell>
                      {formatDuration(
                        student.todayRecord?.timeIn,
                        student.todayRecord?.timeOut
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AttendanceActions
                        studentId={student.id}
                        timeIn={student.todayRecord?.timeIn}
                        timeOut={student.todayRecord?.timeOut}
                        onUpdate={loadAttendance}
                        compact
                      />
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
