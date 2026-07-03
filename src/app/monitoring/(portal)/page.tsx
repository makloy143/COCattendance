import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Server,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import { requireMonitoringSession } from "@/lib/monitoring-auth";
import { getMonitoringDashboardData } from "@/lib/monitoring";

export default async function MonitoringDashboardPage() {
  await requireMonitoringSession();
  const data = await getMonitoringDashboardData();

  const stats = [
    {
      title: "Total Systems",
      value: data.totalSystems,
      icon: Server,
      description: "Monitored IT systems",
    },
    {
      title: "Up Today",
      value: data.systemsUp,
      icon: CheckCircle2,
      description: "Systems operating normally",
    },
    {
      title: "Down Today",
      value: data.systemsDown,
      icon: XCircle,
      description: "Systems currently down",
    },
    {
      title: "With Degradation Today",
      value: data.systemsDegraded,
      icon: AlertTriangle,
      description: "Systems with reduced performance",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Monitoring Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of today&apos;s IT systems status for COC-ILIGAN
          </p>
        </div>
        <ButtonLink href="/monitoring/report">
          <FileSpreadsheet className="size-4" />
          Open Daily Report
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
            <CardTitle>Today&apos;s Issues</CardTitle>
            <Link
              href="/monitoring/report"
              className="text-xs text-primary hover:underline"
            >
              Edit report
            </Link>
          </CardHeader>
          <CardContent>
            {data.lastUpdated && (
              <p className="mb-4 text-xs text-muted-foreground">
                Last updated{" "}
                {format(parseISO(data.lastUpdated), "MMM d, yyyy h:mm a")}
              </p>
            )}
            {data.issues.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  All systems are up. No issues reported today.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.issues.map((issue) => (
                  <div
                    key={issue.systemName}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{issue.systemName}</p>
                      {issue.remarks && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {issue.remarks}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        issue.status === "Down" ? "destructive" : "secondary"
                      }
                    >
                      {issue.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Reports</CardTitle>
            <Link
              href="/monitoring/report"
              className="text-xs text-primary hover:underline"
            >
              View all dates
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reports saved yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentReports.map((report) => (
                  <Link
                    key={report.reportDate}
                    href={`/monitoring/report?date=${report.reportDate}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">
                        {format(parseISO(report.reportDate), "EEEE, MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated{" "}
                        {format(parseISO(report.updatedAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {report.downCount > 0 && (
                        <Badge variant="destructive">{report.downCount} down</Badge>
                      )}
                      {report.degradedCount > 0 && (
                        <Badge variant="secondary">
                          {report.degradedCount} with degradation
                        </Badge>
                      )}
                      {report.downCount === 0 && report.degradedCount === 0 && (
                        <Activity className="size-4 text-emerald-600" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
