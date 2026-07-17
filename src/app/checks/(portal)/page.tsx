import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Droplets,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/lib/checks-shared";
import { requireChecksSession } from "@/lib/checks-auth";
import { getChecksDashboardData } from "@/lib/checks";

const categoryIcon = {
  INK: Droplets,
  TECHNICAL: Wrench,
  OTHER: ClipboardCheck,
} as const;

export default async function ChecksDashboardPage() {
  await requireChecksSession();
  const data = await getChecksDashboardData();

  const stats = [
    {
      title: "Due Today",
      value: data.dueToday,
      icon: CalendarCheck,
      description: "Checks scheduled for today",
    },
    {
      title: "Overdue",
      value: data.overdue,
      icon: AlertTriangle,
      description: "Missed checks needing attention",
    },
    {
      title: "Completed Today",
      value: data.completedToday,
      icon: CheckCircle2,
      description: "Checks finished today",
    },
    {
      title: "Issues Found",
      value: data.issuesFoundToday,
      icon: Clock,
      description: "Problems reported today",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Check Schedule Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Reminders for department ink checks and technical inspections
          </p>
        </div>
        <ButtonLink href="/checks/today">
          <ClipboardCheck className="size-4" />
          Open Today&apos;s Checks
        </ButtonLink>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Due &amp; Overdue Checks</CardTitle>
            <Link
              href="/checks/today"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.dueItems.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  All checks are up to date. Nothing due right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.dueItems.map((item) => {
                  const Icon = categoryIcon[item.category];
                  return (
                    <div
                      key={`${item.templateId}-${item.periodStart}`}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="flex min-w-0 gap-3">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.department} · {item.cadenceLabel}
                          </p>
                          {item.overdueSince && (
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                              Overdue since {item.overdueSince}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          item.urgency === "overdue" ? "destructive" : "secondary"
                        }
                      >
                        {item.urgency === "overdue" ? "Overdue" : "Due today"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link
              href="/checks/history"
              className="text-xs text-primary hover:underline"
            >
              View history
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No check logs yet. Complete your first check from Today&apos;s
                Checks.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{log.templateTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.department} · {CATEGORY_LABELS[log.category]} ·{" "}
                        {log.checkDate}
                      </p>
                      {log.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        log.status === "ISSUE_FOUND" ? "destructive" : "outline"
                      }
                    >
                      {STATUS_LABELS[log.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {data.activeTemplates} active check schedule
            {data.activeTemplates === 1 ? "" : "s"} configured. Manage daily,
            weekly, or monthly reminders from{" "}
            <Link href="/checks/templates" className="text-primary hover:underline">
              Schedules
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
