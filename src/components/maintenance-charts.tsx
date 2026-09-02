"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MaintenanceStats } from "@/lib/maintenance-shared";

type MaintenanceChartsProps = {
  stats: MaintenanceStats;
};

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function DonutCard({
  title,
  description,
  slices,
  total,
}: {
  title: string;
  description: string;
  slices: MaintenanceStats["byStatus"];
  total: number;
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
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        ) : (
          <>
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
                    formatter={(value) => [`${value ?? 0}`, "Issues"]}
                    contentStyle={{
                      borderRadius: 8,
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
                  Issues
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BarsCard({
  title,
  description,
  items,
  emptyLabel,
}: {
  title: string;
  description: string;
  items: MaintenanceStats["byEquipmentType"];
  emptyLabel: string;
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
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
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

export function MaintenanceCharts({ stats }: MaintenanceChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DonutCard
        title="Issues by Status"
        description="Current maintenance workload by status"
        slices={stats.byStatus}
        total={stats.total}
      />
      <BarsCard
        title="Issues by Equipment Type"
        description="Which devices need the most attention"
        items={stats.byEquipmentType}
        emptyLabel="No equipment type data yet."
      />
      <BarsCard
        title="Issues by Location"
        description="Where problems are being reported"
        items={stats.byLocation}
        emptyLabel="No location data yet."
      />
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Maintenance Reports</CardTitle>
          <CardDescription>Issues reported over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          {stats.monthly.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No monthly reports yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`${value ?? 0}`, "Issues"]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
