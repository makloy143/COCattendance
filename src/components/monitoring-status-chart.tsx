"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";

type Issue = {
  systemName: string;
  status: string;
  remarks: string;
};

type MonitoringStatusChartProps = {
  systemsUp: number;
  systemsDown: number;
  systemsDegraded: number;
  totalSystems: number;
  issues: Issue[];
};

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export function MonitoringStatusChart({
  systemsUp,
  systemsDown,
  systemsDegraded,
  totalSystems,
  issues,
}: MonitoringStatusChartProps) {
  const slices = [
    { key: "up", label: "Up", value: systemsUp, color: "#059669" },
    {
      key: "degraded",
      label: "With Degradation",
      value: systemsDegraded,
      color: "#d97706",
    },
    { key: "down", label: "Down", value: systemsDown, color: "#dc2626" },
  ].filter((slice) => slice.value > 0);

  const chartData =
    slices.length > 0
      ? slices
      : [{ key: "empty", label: "No data", value: 1, color: "#e5e7eb" }];

  const allClear = systemsDown === 0 && systemsDegraded === 0 && totalSystems > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                innerRadius={58}
                outerRadius={78}
                paddingAngle={chartData.length > 1 ? 2 : 0}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              {slices.length > 0 && (
                <Tooltip
                  formatter={(value) => [`${value ?? 0}`, "Systems"]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              {totalSystems}
            </span>
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Systems
            </span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {(
            [
              { key: "up", label: "Up", value: systemsUp, color: "#059669" },
              {
                key: "degraded",
                label: "With Degradation",
                value: systemsDegraded,
                color: "#d97706",
              },
              {
                key: "down",
                label: "Down",
                value: systemsDown,
                color: "#dc2626",
              },
            ] as const
          ).map((slice) => (
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
                  {percent(slice.value, totalSystems)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {allClear ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          All systems are up. No issues reported today.
        </p>
      ) : issues.length > 0 ? (
        <div className="space-y-2 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Affected systems
          </p>
          {issues.map((issue) => (
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
      ) : null}
    </div>
  );
}
