"use client";

import type { CSSProperties } from "react";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTableShell } from "@/components/responsive-table-shell";
import { cn } from "@/lib/utils";
import type { MonitoringEntryDto } from "@/lib/monitoring";
import {
  CATEGORY_LABELS,
  getCategoryBgColor,
  getUserExperienceOptions,
  MONITORING_CATEGORIES,
  MONITORING_SHIFT_OPTIONS,
  MONITORING_STATUS_OPTIONS,
  STATUS_BG_COLORS,
  type MonitoringCategory,
  type MonitoringShift,
  type MonitoringStatus,
} from "@/lib/monitoring-systems";

export type MonitoringEntryValues = Omit<
  MonitoringEntryDto,
  "id" | "systemName" | "category" | "sortOrder"
>;

type DailyMonitoringReportProps = {
  reportDate: string;
  shiftType: MonitoringShift;
  entries: MonitoringEntryDto[];
  onShiftChange: (shiftType: MonitoringShift) => void;
  onEntryChange: (
    systemId: string,
    field: keyof MonitoringEntryValues,
    value: string
  ) => void;
};

function getStatusClassName(status: string) {
  const color = STATUS_BG_COLORS[status as MonitoringStatus];
  if (!color) return "bg-muted text-foreground";
  return "text-white font-semibold";
}

function getStatusStyle(status: string) {
  const color = STATUS_BG_COLORS[status as MonitoringStatus];
  if (!color) return undefined;
  return { backgroundColor: color };
}

function groupEntriesByCategory(entries: MonitoringEntryDto[]) {
  return MONITORING_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    bgClass: getCategoryBgColor(category, { transparent: true }),
    entries: entries
      .filter((entry) => entry.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  })).filter((group) => group.entries.length > 0);
}

export function DailyMonitoringReport({
  reportDate,
  shiftType,
  entries,
  onShiftChange,
  onEntryChange,
}: DailyMonitoringReportProps) {
  const formattedDate = format(parseISO(reportDate), "EEEE, MMMM dd, yyyy");
  const groups = groupEntriesByCategory(entries);

  return (
    <div
      data-monitoring-report-export
      className="overflow-hidden rounded-xl border bg-white"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center bg-[#166534] px-4 py-3 text-sm font-bold text-white sm:text-base">
        <div aria-hidden="true" />
        <div className="flex items-center justify-center gap-2">
          <span>COC-ILIGAN -</span>
          <Select
            value={shiftType}
            onValueChange={(value) =>
              onShiftChange((value ?? "IN") as MonitoringShift)
            }
          >
            <SelectTrigger className="h-8 w-[4.5rem] border-white/30 bg-white/10 font-bold text-white shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONITORING_SHIFT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-right text-xs sm:text-sm">{formattedDate}</span>
      </div>

      <ResponsiveTableShell className="rounded-none border-0" minWidthClassName="min-w-[1100px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f97316] hover:bg-[#f97316]">
              <TableHead className="w-12 border border-black/20 font-bold text-black" />
              <TableHead className="border border-black/20 font-bold text-black">
                System
              </TableHead>
              <TableHead className="border border-black/20 font-bold text-black">
                Status
              </TableHead>
              <TableHead className="border border-black/20 font-bold text-black">
                Account No.
              </TableHead>
              <TableHead className="border border-black/20 font-bold text-black">
                Uptime
              </TableHead>
              <TableHead className="border border-black/20 font-bold text-black">
                Downtime
              </TableHead>
              <TableHead className="border border-black/20 font-bold text-black">
                Restoration
              </TableHead>
              <TableHead className="border border-black/20 font-bold text-black">
                User Experience
              </TableHead>
              <TableHead className="border border-black/20 font-bold text-black">
                Remarks
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) =>
              group.entries.map((entry, index) => (
                <TableRow
                  key={entry.systemId}
                  className="border-b hover:opacity-95 hover:bg-[var(--category-bg)]"
                  style={
                    {
                      backgroundColor: group.bgClass,
                      "--category-bg": group.bgClass,
                    } as CSSProperties
                  }
                >
                  {index === 0 && (
                    <TableCell
                      rowSpan={group.entries.length}
                      className="w-12 border border-black/20 p-1 text-center align-middle font-bold text-black"
                      style={{ backgroundColor: group.bgClass }}
                    >
                      <span
                        className="inline-block text-[10px] leading-tight sm:text-xs"
                        style={{
                          writingMode: "vertical-rl",
                          textOrientation: "mixed",
                          transform: "rotate(180deg)",
                        }}
                      >
                        {group.label}
                      </span>
                    </TableCell>
                  )}
                  <TableCell
                    className="border border-black/20 font-medium"
                    style={{ backgroundColor: group.bgClass }}
                  >
                    {entry.systemName}
                  </TableCell>
                  <TableCell
                    className="border border-black/20 p-1"
                    style={{ backgroundColor: group.bgClass }}
                  >
                    <Select
                      value={entry.status}
                      onValueChange={(value) =>
                        onEntryChange(entry.systemId, "status", value ?? "Up")
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "h-8 w-full border-0 shadow-none",
                          getStatusClassName(entry.status)
                        )}
                        style={getStatusStyle(entry.status)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONITORING_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell
                    className="border border-black/20 p-1"
                    style={{ backgroundColor: group.bgClass }}
                  >
                    <Input
                      value={entry.accountNo}
                      onChange={(event) =>
                        onEntryChange(
                          entry.systemId,
                          "accountNo",
                          event.target.value
                        )
                      }
                      className="h-8 border-black/10 bg-white/80"
                    />
                  </TableCell>
                  <TableCell
                    className="border border-black/20 p-1"
                    style={{ backgroundColor: group.bgClass }}
                  >
                    <Input
                      value={entry.uptime}
                      onChange={(event) =>
                        onEntryChange(
                          entry.systemId,
                          "uptime",
                          event.target.value
                        )
                      }
                      placeholder="37 days"
                      className="h-8 border-black/10 bg-white/80"
                    />
                  </TableCell>
                  <TableCell
                    className="border border-black/20 p-1"
                    style={{ backgroundColor: group.bgClass }}
                  >
                    <Input
                      value={entry.downtime}
                      onChange={(event) =>
                        onEntryChange(
                          entry.systemId,
                          "downtime",
                          event.target.value
                        )
                      }
                      className="h-8 border-black/10 bg-white/80"
                    />
                  </TableCell>
                  <TableCell
                    className="border border-black/20 p-1"
                    style={{ backgroundColor: group.bgClass }}
                  >
                    <Input
                      value={entry.restoration}
                      onChange={(event) =>
                        onEntryChange(
                          entry.systemId,
                          "restoration",
                          event.target.value
                        )
                      }
                      className="h-8 border-black/10 bg-white/80"
                    />
                  </TableCell>
                  <TableCell
                    className="border border-black/20 p-1"
                    style={{ backgroundColor: group.bgClass }}
                  >
                    <UxSelect
                      category={entry.category}
                      value={entry.userExperience}
                      onValueChange={(value) =>
                        onEntryChange(entry.systemId, "userExperience", value)
                      }
                    />
                  </TableCell>
                  <TableCell
                    className="border border-black/20 p-1"
                    style={{ backgroundColor: group.bgClass }}
                  >
                    <Input
                      value={entry.remarks}
                      onChange={(event) =>
                        onEntryChange(
                          entry.systemId,
                          "remarks",
                          event.target.value
                        )
                      }
                      className="h-8 border-black/10 bg-white/80"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ResponsiveTableShell>
    </div>
  );
}

function UxSelect({
  category,
  value,
  onValueChange,
}: {
  category: MonitoringCategory;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const options = getUserExperienceOptions(category);

  return (
    <Select value={value} onValueChange={(next) => onValueChange(next ?? value)}>
      <SelectTrigger className="h-8 w-full border-black/10 bg-white/80">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
