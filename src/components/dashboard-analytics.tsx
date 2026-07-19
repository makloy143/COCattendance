"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardAnalyticsData } from "@/lib/dashboard-analytics";
import { cn } from "@/lib/utils";

type DashboardAnalyticsProps = {
  data: DashboardAnalyticsData;
};

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function DonutChartCard({
  title,
  description,
  slices,
  total,
  totalLabel,
}: {
  title: string;
  description: string;
  slices: DashboardAnalyticsData["byStatus"];
  total: number;
  totalLabel: string;
}) {
  const chartData = slices.map((slice) => ({
    name: slice.label,
    value: slice.value,
    color: slice.color,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={78}
                paddingAngle={chartData.length > 1 ? 2 : 0}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value ?? 0}`, "Records"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              {total}
            </span>
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              {totalLabel}
            </span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {slices.map((slice) => (
            <li
              key={slice.key}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-muted-foreground">
                  {slice.label}
                </span>
              </div>
              <span className="shrink-0 tabular-nums text-foreground">
                <span className="font-medium">{slice.value}</span>
                <span className="ml-1.5 text-muted-foreground">
                  {percent(slice.value, total)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function AssignmentBarsCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: DashboardAnalyticsData["byAssignment"];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No assignment data for this period.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {item.value}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{
                      width: `${(item.value / max) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardAnalytics({ data }: DashboardAnalyticsProps) {
  const typeSlices = data.byType.map((slice) => ({
    ...slice,
    label:
      slice.key === "SA"
        ? "SA"
        : slice.key === "HK"
          ? "HK"
          : slice.label,
  }));

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Analytics & Insights
          </h2>
          <p className="text-sm text-muted-foreground">
            Attendance trends and distribution for the last 14 days
          </p>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-2 self-start rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
          )}
        >
          <Filter className="size-3.5" />
          Scoped to {data.scopeLabel}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Attendance Trend</CardTitle>
              <CardDescription>
                Timed in vs. completed per work day
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#2563eb]" />
                Timed In
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#16a34a]" />
                Completed
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.trend}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="timedInFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient
                    id="completedFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="timedIn"
                  name="Timed In"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#timedInFill)"
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  fill="url(#completedFill)"
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <DonutChartCard
          title="Attendance by Status"
          description="Current distribution across statuses"
          slices={data.byStatus}
          total={data.totalRecords}
          totalLabel="Records"
        />
        <DonutChartCard
          title="Attendance by Type"
          description="Student assistant type breakdown"
          slices={typeSlices}
          total={data.totalRecords}
          totalLabel="Records"
        />
        <AssignmentBarsCard
          title="Attendance by Assignment"
          description="Workload by office assignment"
          items={data.byAssignment}
        />
      </div>
    </section>
  );
}
