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
import { INK_CHART_COLORS } from "@/lib/ink-dashboard";
import type { InkColor } from "@/lib/inventory";

export function InkTrendChart({
  points,
}: {
  points: { label: string; received: number; released: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} barGap={2}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={points.length > 8 ? -40 : 0} height={points.length > 8 ? 56 : 30} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} width={28} />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Bar dataKey="received" name="Received" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="released" name="Released" fill="#22c55e" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InkDistributionChart({
  slices,
  total,
}: {
  slices: { name: string; value: number; inkColor: InkColor | null }[];
  total: number;
}) {
  const data = slices.filter((slice) => slice.value > 0);

  return (
    <div className="relative mx-auto h-44 w-44 shrink-0">
      {data.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center rounded-full border-[14px] border-slate-200">
          <div className="text-center">
            <p className="text-2xl font-semibold tabular-nums">0</p>
            <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Bottles</p>
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={data.length > 1 ? 2 : 0} strokeWidth={0}>
                {data.map((slice) => (
                  <Cell key={slice.name} fill={slice.inkColor ? INK_CHART_COLORS[slice.inkColor] : "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value ?? 0} bottles`, "In stock"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tabular-nums">{total}</span>
            <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Bottles</span>
          </div>
        </>
      )}
    </div>
  );
}
