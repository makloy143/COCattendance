import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentAvatar } from "@/components/student-avatar";
import {
  getScheduleStatusLabel,
  type ScheduleDutyStatus,
  type ScheduleMonitoringSummary,
  type StudentScheduleMonitorRow,
} from "@/lib/schedule-monitoring";
import { getStudentAssignmentLabel } from "@/lib/student-assignment";
import { cn } from "@/lib/utils";

const STATUS_BADGE_CLASSES: Record<ScheduleDutyStatus, string> = {
  OFF_DUTY: "bg-muted text-muted-foreground border-border",
  UPCOMING: "bg-blue-50 text-blue-700 border-blue-200",
  WAITING: "bg-amber-50 text-amber-700 border-amber-200",
  ON_TIME: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LATE: "bg-orange-50 text-orange-700 border-orange-200",
  ABSENT: "bg-red-50 text-red-700 border-red-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function ScheduleStatusBadge({ status }: { status: ScheduleDutyStatus }) {
  return (
    <Badge variant="outline" className={cn("shrink-0", STATUS_BADGE_CLASSES[status])}>
      {getScheduleStatusLabel(status)}
    </Badge>
  );
}

export function ScheduleMonitoringStats({
  summary,
}: {
  summary: ScheduleMonitoringSummary;
}) {
  const stats = [
    {
      title: "Scheduled Today",
      value: summary.scheduledToday,
      description: `${summary.dayLabel} duty assignments`,
      icon: CalendarClock,
    },
    {
      title: "On Time",
      value: summary.onTime + summary.completed,
      description: "Arrived within grace period",
      icon: CheckCircle2,
    },
    {
      title: "Late",
      value: summary.late,
      description: "Timed in after scheduled start",
      icon: Clock,
    },
    {
      title: "Absent",
      value: summary.absent,
      description: "No time in for scheduled duty",
      icon: UserX,
    },
  ];

  return (
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
  );
}

export function ScheduleRecommendationsCard({
  recommendations,
  limit,
}: {
  recommendations: StudentScheduleMonitorRow[];
  limit?: number;
}) {
  const items = limit ? recommendations.slice(0, limit) : recommendations;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-orange-500" />
          Schedule Alerts & Recommendations
        </CardTitle>
        {recommendations.length > 0 && (
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            {recommendations.length} alert
            {recommendations.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              No late or absent alerts for scheduled students right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "rounded-lg border border-l-4 p-3",
                  row.status === "ABSENT" && "border-l-red-500",
                  row.status === "LATE" && "border-l-orange-500",
                  row.status === "WAITING" && "border-l-amber-500"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/students/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.firstName} {row.lastName}
                      </Link>
                      <ScheduleStatusBadge status={row.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.dutyDaysLabel} ·{" "}
                      {getStudentAssignmentLabel(row.assignment)}
                      {row.scheduledStartDisplay &&
                        ` · Today ${row.scheduledStartDisplay}–${row.scheduledEndDisplay}`}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {row.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ScheduleMonitoringTable({
  students,
}: {
  students: StudentScheduleMonitorRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Student</th>
            <th className="px-3 py-2 font-medium">Duty Assignment</th>
            <th className="px-3 py-2 font-medium">Weekly Schedule</th>
            <th className="px-3 py-2 font-medium">Today</th>
            <th className="px-3 py-2 font-medium">Time In</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="px-3 py-2">
                <Link
                  href={`/students/${row.id}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <StudentAvatar
                    photoUrl={row.photoUrl}
                    firstName={row.firstName}
                    lastName={row.lastName}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium">
                      {row.firstName} {row.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.studentId}
                    </p>
                  </div>
                </Link>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {getStudentAssignmentLabel(row.assignment)}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {row.weeklySchedule
                    .filter((slot) => slot.isEnabled)
                    .map((slot) => (
                      <Badge key={slot.dayOfWeek} variant="outline" className="text-xs">
                        {slot.dayLabel.slice(0, 3)} {slot.startTime}
                      </Badge>
                    ))}
                  {!row.weeklySchedule.some((slot) => slot.isEnabled) && (
                    <span className="text-xs text-muted-foreground">
                      Not configured
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {row.scheduledStartDisplay
                  ? `${row.scheduledStartDisplay}–${row.scheduledEndDisplay}`
                  : "Off duty"}
              </td>
              <td className="px-3 py-2">{row.timeInDisplay}</td>
              <td className="px-3 py-2">
                <ScheduleStatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
