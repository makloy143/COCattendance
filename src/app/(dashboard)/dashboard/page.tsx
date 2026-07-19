import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/button-link";
import { DashboardAnalytics } from "@/components/dashboard-analytics";
import { DashboardDepartmentFilter } from "@/components/dashboard-department-filter";
import { ScheduleRecommendationsCard } from "@/components/schedule-monitoring-cards";
import { StudentAvatar } from "@/components/student-avatar";
import { AttendanceStatusBadge } from "@/components/attendance-status-badge";
import {
  requireSession,
  getStudentDepartmentFilter,
  isSuperAdmin,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDashboardAnalyticsData } from "@/lib/dashboard-analytics";
import { listDepartmentOptions } from "@/lib/departments-server";
import { getDepartmentLabel } from "@/lib/departments";
import { formatTime, getTodayStart } from "@/lib/date-utils";
import { getScheduleMonitoringData } from "@/lib/schedule-monitoring";
import { getStudentAssignmentLabel } from "@/lib/student-assignment";

async function getDashboardData(departmentScope?: string | null) {
  const session = await requireSession();
  const departmentFilter = getStudentDepartmentFilter(
    session,
    departmentScope
  );
  const todayStart = getTodayStart();

  const [
    totalStudents,
    todayRecords,
    recentRecords,
    scheduleMonitoring,
    analytics,
  ] = await Promise.all([
    prisma.student.count({ where: { isActive: true, ...departmentFilter } }),
    prisma.attendanceRecord.findMany({
      where: {
        date: todayStart,
        student: departmentFilter,
      },
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
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { student: departmentFilter },
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
            department: true,
          },
        },
      },
    }),
    getScheduleMonitoringData(session, todayStart, departmentScope),
    getDashboardAnalyticsData(session, departmentScope),
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
    scheduleMonitoring,
    analytics,
    showDepartmentBadge: isSuperAdmin(session) && !departmentScope,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const superAdmin = isSuperAdmin(session);

  const departments = superAdmin
    ? await listDepartmentOptions()
    : [];

  const requestedDepartment = params.department?.trim() || null;
  const departmentScope =
    superAdmin &&
    requestedDepartment &&
    departments.some((item) => item.code === requestedDepartment)
      ? requestedDepartment
      : null;

  const data = await getDashboardData(departmentScope);

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

  const subtitle = departmentScope
    ? `Overview for ${getDepartmentLabel(departmentScope)}`
    : superAdmin
      ? "Overview of student attendance across all departments"
      : "Overview of student attendance for today";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {superAdmin ? (
          <DashboardDepartmentFilter
            departments={departments.map((item) => ({
              code: item.code,
              label: item.label,
            }))}
            selectedDepartment={departmentScope}
          />
        ) : null}
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

      <DashboardAnalytics data={data.analytics} />

      {(data.scheduleMonitoring.summary.absent > 0 ||
        data.scheduleMonitoring.summary.late > 0) && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-orange-500" />
              Today&apos;s Schedule Alerts
            </CardTitle>
            <ButtonLink href="/schedule" variant="outline" size="sm">
              Open Duty Schedule
            </ButtonLink>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.scheduleMonitoring.summary.absent > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {data.scheduleMonitoring.summary.absent} absent
              </Badge>
            )}
            {data.scheduleMonitoring.summary.late > 0 && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                {data.scheduleMonitoring.summary.late} late
              </Badge>
            )}
            {data.scheduleMonitoring.summary.waiting > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                {data.scheduleMonitoring.summary.waiting} waiting to time in
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <ScheduleRecommendationsCard
        recommendations={data.scheduleMonitoring.recommendations}
        limit={5}
      />

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
                        {data.showDepartmentBadge ? (
                          <Badge variant="outline" className="text-[10px]">
                            {getDepartmentLabel(record.student.department)}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm sm:shrink-0 sm:justify-end sm:gap-3">
                    <span className="text-muted-foreground">
                      In {formatTime(record.timeIn)} · Out{" "}
                      {formatTime(record.timeOut)}
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
