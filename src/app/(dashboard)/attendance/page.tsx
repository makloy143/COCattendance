"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { DutyWeekCalendar } from "@/components/duty-week-calendar";
import { formatDuration, formatTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

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

type AttendanceView = "list" | "week";

export default function AttendancePage() {
  const [students, setStudents] = useState<TodayStudent[]>([]);
  const [canReset, setCanReset] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AttendanceView>("week");

  async function loadAttendance() {
    setLoading(true);
    const response = await fetch("/api/attendance?today=true");
    const data = await response.json();
    setStudents(data.students ?? []);
    setCanReset(Boolean(data.canResetAttendance));
    setLoading(false);
  }

  useEffect(() => {
    if (view === "list") {
      void loadAttendance();
    }
  }, [view]);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {view === "week" ? "Duty Week Schedule" : "Today's Attendance"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {view === "week"
              ? "See who is assigned each day and their hours of duty"
              : "Record time in and time out for all active students"}
          </p>
        </div>

        <div className="inline-flex w-fit shrink-0 self-start rounded-lg border bg-card p-0.5">
          <Button
            type="button"
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("week")}
            className={cn(view === "week" && "shadow-sm")}
          >
            <CalendarDays data-icon="inline-start" />
            Week
          </Button>
          <Button
            type="button"
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className={cn(view === "list" && "shadow-sm")}
          >
            <List data-icon="inline-start" />
            List
          </Button>
        </div>
      </div>

      {view === "week" ? (
        <DutyWeekCalendar />
      ) : (
        <>
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
                      canReset={canReset}
                      compact
                      fullWidth
                    />
                  </div>
                ))}
              </div>

              <ResponsiveTableShell
                className="hidden md:block"
                minWidthClassName="min-w-[880px]"
              >
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
                        <TableCell>
                          {formatTime(student.todayRecord?.timeIn)}
                        </TableCell>
                        <TableCell>
                          {formatTime(student.todayRecord?.timeOut)}
                        </TableCell>
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
                            canReset={canReset}
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
        </>
      )}
    </div>
  );
}
