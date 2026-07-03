import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/student-avatar";
import { AttendanceStatusBadge } from "@/components/attendance-status-badge";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTime, getTodayStart } from "@/lib/date-utils";
import { getStudentAssignmentLabel } from "@/lib/student-assignment";

async function getDashboardData() {
  const todayStart = getTodayStart();

  const [totalStudents, todayRecords, recentRecords] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.attendanceRecord.findMany({
      where: { date: todayStart },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            studentType: true,
            assignment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendanceRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            studentType: true,
            assignment: true,
          },
        },
      },
    }),
  ]);

  const presentToday = todayRecords.filter((r) => r.timeIn).length;
  const stillIn = todayRecords.filter((r) => r.timeIn && !r.timeOut).length;
  const completed = todayRecords.filter((r) => r.timeIn && r.timeOut).length;

  return {
    totalStudents,
    presentToday,
    stillIn,
    completed,
    recentRecords,
  };
}

export default async function DashboardPage() {
  await requireSession();
  const data = await getDashboardData();

  const stats = [
    {
      title: "Total Students",
      value: data.totalStudents,
      icon: Users,
      description: "Active registered students",
    },
    {
      title: "Present Today",
      value: data.presentToday,
      icon: UserCheck,
      description: "Students who timed in",
    },
    {
      title: "Still In",
      value: data.stillIn,
      icon: Clock,
      description: "Timed in, not yet out",
    },
    {
      title: "Completed",
      value: data.completed,
      icon: CheckCircle2,
      description: "Full in and out today",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of student attendance for today
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attendance records yet. Register students and record time in/out.
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentRecords.map((record) => (
                <Link
                  key={record.id}
                  href={`/students/${record.student.id}`}
                  className="flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <StudentAvatar
                      photoUrl={record.student.photoUrl}
                      firstName={record.student.firstName}
                      lastName={record.student.lastName}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {record.student.firstName} {record.student.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {record.student.studentId}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {record.student.studentType}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {getStudentAssignmentLabel(record.student.assignment)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm sm:shrink-0 sm:justify-end sm:gap-3">
                    <span className="text-muted-foreground">
                      In {formatTime(record.timeIn)} · Out {formatTime(record.timeOut)}
                    </span>
                    <AttendanceStatusBadge
                      timeIn={record.timeIn}
                      timeOut={record.timeOut}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
