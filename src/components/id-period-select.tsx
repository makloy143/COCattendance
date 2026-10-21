"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import {
  ID_PERIODS,
  ID_PERIOD_LABELS,
  parseIdPeriod,
} from "@/lib/id-maintenance";

const PERIOD_PATHS = new Set([
  "/inventory/id",
  "/inventory/id/release",
  "/inventory/id/bad-printing",
  "/inventory/id/history",
  "/inventory/id/reports",
  "/inventory/inks",
  "/inventory/inks/reports",
]);

function IdPeriodSelectControl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  if (!PERIOD_PATHS.has(pathname)) return null;

  const period = parseIdPeriod(searchParams.get("period"));
  const periods = pathname.endsWith("/reports")
    ? ID_PERIODS
    : ID_PERIODS.filter((value) => value !== "week" || period === "week");

  return (
    <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-sm text-slate-700 shadow-sm">
      <CalendarDays className="size-4 text-[#0e6b43]" />
      <span className="sr-only">Activity period</span>
      <select
        value={period}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          next.set("period", event.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="bg-transparent pr-1 text-sm font-medium outline-none"
      >
        {periods.map((value) => (
          <option key={value} value={value}>
            {ID_PERIOD_LABELS[value]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function IdPeriodSelect() {
  return (
    <Suspense fallback={null}>
      <IdPeriodSelectControl />
    </Suspense>
  );
}
