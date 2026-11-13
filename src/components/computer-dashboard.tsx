import Link from "next/link";
import { ArrowRight, Building2, LibraryBig, Monitor, Plus, ShieldAlert } from "lucide-react";
import { COMPUTER_STATUS_BAR, ComputerStatusBadge } from "@/components/computer-status-badge";
import type { ComputerDashboardData } from "@/lib/computers-data";
import {
  COMPUTER_GROUP_LABELS,
  COMPUTER_GROUP_PLACE_LABELS,
  COMPUTER_STATUSES,
  COMPUTER_STATUS_LABELS,
  computerLocationLabel,
  type ComputerGroup,
  type ComputerStatusCounts,
} from "@/lib/computers";
import { cn } from "@/lib/utils";

const GROUP_ICONS: Record<ComputerGroup, typeof Monitor> = {
  COMLAB: Monitor,
  LIBRARY: LibraryBig,
  DEPARTMENT: Building2,
};

function StatusBar({ counts, className }: { counts: ComputerStatusCounts; className?: string }) {
  return (
    <div
      className={cn("flex h-2 overflow-hidden rounded-full bg-slate-100", className)}
      role="img"
      aria-label={COMPUTER_STATUSES.map((status) => `${counts[status]} ${COMPUTER_STATUS_LABELS[status].toLowerCase()}`).join(", ")}
    >
      {counts.total > 0
        ? COMPUTER_STATUSES.map((status) =>
            counts[status] > 0 ? (
              <div
                key={status}
                className={COMPUTER_STATUS_BAR[status]}
                style={{ width: `${(counts[status] / counts.total) * 100}%` }}
              />
            ) : null
          )
        : null}
    </div>
  );
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function Kpi({
  label,
  value,
  hint,
  tone,
  href,
}: {
  label: string;
  value: number;
  hint: string;
  tone: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-white p-4 shadow-sm transition-colors hover:border-slate-300 sm:p-5"
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={cn("mt-1 text-3xl font-semibold tracking-tight tabular-nums", tone)}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </Link>
  );
}

export function ComputerDashboard({ data }: { data: ComputerDashboardData }) {
  const { totals } = data;
  const share = (count: number) =>
    totals.total > 0 ? `${Math.round((count / totals.total) * 100)}% of all units` : "No units yet";

  if (totals.total === 0) {
    return (
      <section className="rounded-xl border border-dashed bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#e8eef8] text-[#16324f]">
          <Monitor className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Start your computer inventory</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
          Add each computer with its location and status. Totals for COMLAB, Library, and every
          department appear here as you go.
        </p>
        <Link
          href="/inventory/computers/list?add=1"
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#16324f] px-4 text-sm font-medium text-white hover:bg-[#1d4168]"
        >
          <Plus className="size-4" />
          Add computer
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total computers"
          value={totals.total}
          hint={`${plural(totals.RETIRED, "retired unit")} included`}
          tone="text-slate-900"
          href="/inventory/computers/list"
        />
        <Kpi
          label="Working"
          value={totals.WORKING}
          hint={share(totals.WORKING)}
          tone="text-emerald-600"
          href="/inventory/computers/list?status=WORKING"
        />
        <Kpi
          label="Under repair"
          value={totals.UNDER_REPAIR}
          hint={share(totals.UNDER_REPAIR)}
          tone="text-amber-600"
          href="/inventory/computers/list?status=UNDER_REPAIR"
        />
        <Kpi
          label="Defective"
          value={totals.DEFECTIVE}
          hint={share(totals.DEFECTIVE)}
          tone="text-rose-600"
          href="/inventory/computers/list?status=DEFECTIVE"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {data.groups.map(({ group, places, counts }) => {
          const Icon = GROUP_ICONS[group];
          return (
            <Link
              key={group}
              href={`/inventory/computers/list?group=${group}`}
              className="group rounded-xl border bg-white p-4 shadow-sm transition-colors hover:border-slate-300 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#e8eef8] text-[#16324f]">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold">{COMPUTER_GROUP_LABELS[group]}</h2>
                    <p className="text-xs text-slate-500">
                      {plural(counts.total, "unit")} · {plural(places, COMPUTER_GROUP_PLACE_LABELS[group])}
                    </p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </div>
              <StatusBar counts={counts} className="mt-4" />
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                {(["WORKING", "UNDER_REPAIR", "DEFECTIVE"] as const).map((status) => (
                  <div key={status}>
                    <dt className="text-slate-500">{COMPUTER_STATUS_LABELS[status]}</dt>
                    <dd className="text-sm font-semibold tabular-nums">{counts[status]}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Departments</h2>
            <Link href="/inventory/computers/settings" className="text-xs font-medium text-[#2f6fed] hover:underline">
              Manage departments
            </Link>
          </div>
          {data.departments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Add a department in Settings to assign computers to it.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {data.departments.map((department) => (
                <li key={department.id}>
                  <Link
                    href={`/inventory/computers/list?location=${department.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-3 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <span className="truncate font-medium">{department.name}</span>
                    <StatusBar counts={department.counts} />
                    <span className="w-16 text-right text-xs tabular-nums text-slate-500">
                      {plural(department.counts.total, "unit")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Needs attention</h2>
            <span className="text-xs text-slate-500">{plural(data.attentionTotal, "unit")}</span>
          </div>
          {data.attention.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Every computer is working or retired.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {data.attention.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.assetTag}</p>
                    <p className="truncate text-xs text-slate-500">
                      {computerLocationLabel({ name: row.locationName, group: row.group })}
                      {row.issue ? ` · ${row.issue}` : ""}
                    </p>
                  </div>
                  <ComputerStatusBadge status={row.status} />
                </li>
              ))}
            </ul>
          )}
          {data.attentionTotal > data.attention.length ? (
            <Link
              href="/inventory/computers/list?status=ATTENTION"
              className="mt-3 inline-block text-xs font-medium text-[#2f6fed] hover:underline"
            >
              View all {data.attentionTotal}
            </Link>
          ) : null}
          {data.warrantyExpiring > 0 ? (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <ShieldAlert className="size-4 shrink-0" />
              {data.warrantyExpiring === 1 ? "1 warranty ends" : `${data.warrantyExpiring} warranties end`} in the next 60 days.
            </p>
          ) : null}
        </section>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {COMPUTER_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", COMPUTER_STATUS_BAR[status])} />
            {COMPUTER_STATUS_LABELS[status]}
          </li>
        ))}
      </ul>
    </div>
  );
}
