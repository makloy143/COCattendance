"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/button-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTableShell } from "@/components/responsive-table-shell";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/student-avatar";
import { AttendanceActions } from "@/components/attendance-actions";
import { StudentQrCard } from "@/components/student-qr-card";
import { formatDate, formatDuration, formatTime, formatTotalHours } from "@/lib/date-utils";
import {
  formatScheduleTime,
  getWeekdayLabel,
  type ScheduleSlot,
} from "@/lib/schedule";
import { getStudentAssignmentLabel, type StudentAssignment } from "@/lib/student-assignment";
import { getStudentTypeLabel, type StudentType } from "@/lib/student-type";

type AttendanceRecord = {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
};

type StudentProfile = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  course: string | null;
  yearLevel: string | null;
  studentType: StudentType;
  assignment: StudentAssignment;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  scheduleSlots: ScheduleSlot[];
  attendance: AttendanceRecord[];
  todayRecord: AttendanceRecord | null;
  totalMinutes: number;
  canResetAttendance?: boolean;
};

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>("");
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStudent = useCallback(async (id: string) => {
    setLoading(true);
    const response = await fetch(`/api/students/${id}`);
    if (!response.ok) {
      toast.error("Student not found");
      router.push("/students");
      return;
    }
    const data = await response.json();
    setStudent(data);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    params.then(({ id }) => {
      setStudentId(id);
      loadStudent(id);
    });
  }, [params, loadStudent]);

  async function toggleActive() {
    if (!student) return;
    const response = await fetch(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !student.isActive }),
    });
    if (response.ok) {
      toast.success(student.isActive ? "Student deactivated" : "Student reactivated");
      loadStudent(student.id);
    }
  }

  if (loading || !student) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href="/students" variant="ghost" size="sm">
          <ArrowLeft className="size-4" />
          Back to students
        </ButtonLink>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
          <StudentAvatar
            photoUrl={student.photoUrl}
            firstName={student.firstName}
            lastName={student.lastName}
            size="xl"
          />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold sm:text-2xl">
                {student.firstName} {student.lastName}
              </h1>
              <Badge variant={student.isActive ? "secondary" : "outline"}>
                {student.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">{student.studentType}</Badge>
            </div>
            <p className="text-muted-foreground">ID: {student.studentId}</p>
            <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <p>Course: {student.course || "—"}</p>
              <p>Year: {student.yearLevel || "—"}</p>
              <p>Type: {getStudentTypeLabel(student.studentType)}</p>
              <p>Assign to: {getStudentAssignmentLabel(student.assignment)}</p>
              <p>Email: {student.email || "—"}</p>
              <p>Phone: {student.phone || "—"}</p>
              <p>Registered: {formatDate(student.createdAt)}</p>
              <p className="font-medium text-foreground">
                Total hours: {formatTotalHours(student.totalMinutes ?? 0)}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <ButtonLink href={`/students/${student.id}/edit`} className="w-full sm:w-auto">
              <Pencil className="size-4" />
              Edit profile
            </ButtonLink>
            <Button variant="outline" onClick={toggleActive} className="w-full sm:w-auto">
              {student.isActive ? "Deactivate" : "Reactivate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {student.scheduleSlots.filter((slot) => slot.isEnabled).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No schedule set for weekdays.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {student.scheduleSlots
                .filter((slot) => slot.isEnabled)
                .map((slot) => (
                  <div
                    key={slot.dayOfWeek}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{getWeekdayLabel(slot.dayOfWeek)}</p>
                    <p className="text-muted-foreground">
                      {formatScheduleTime(slot.startTime)} –{" "}
                      {formatScheduleTime(slot.endTime)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <AttendanceActions
          studentId={student.id}
          timeIn={student.todayRecord?.timeIn}
          timeOut={student.todayRecord?.timeOut}
          onUpdate={() => loadStudent(studentId)}
          canReset={Boolean(student.canResetAttendance)}
        />
        <StudentQrCard
          studentDbId={student.id}
          studentId={student.studentId}
          firstName={student.firstName}
          lastName={student.lastName}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Attendance History</CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Total: {formatTotalHours(student.totalMinutes ?? 0)}
          </p>
        </CardHeader>
        <CardContent>
          {student.attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records yet.</p>
          ) : (
            <ResponsiveTableShell minWidthClassName="min-w-[560px]">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{formatTime(record.timeIn)}</TableCell>
                    <TableCell>{formatTime(record.timeOut)}</TableCell>
                    <TableCell>
                      {formatDuration(record.timeIn, record.timeOut)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </ResponsiveTableShell>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
