"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  addManilaDays,
  formatManilaDateInput,
  formatManilaMonthYear,
  getManilaDayOfWeek,
  getManilaWeekNumber,
  getManilaWeekStart,
} from "@/lib/date-utils";
import { formatScheduleTime, WEEKDAY_LABELS } from "@/lib/schedule";
import {
  getStudentAssignmentLabel,
  type StudentAssignment,
} from "@/lib/student-assignment";
import type {
  ScheduleMonitoringData,
  StudentScheduleMonitorRow,
} from "@/lib/schedule-monitoring-shared";
import { cn } from "@/lib/utils";

const HOUR_HEIGHT = 56;
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 18;
const MIN_BLOCK_HEIGHT = 28;

const ASSIGNMENT_COLORS: Record<
  StudentAssignment,
  { bg: string; border: string; text: string }
> = {
  REGISTRAR: {
    bg: "bg-emerald-500",
    border: "border-emerald-600",
    text: "text-white",
  },
  FINANCE: {
    bg: "bg-orange-500",
    border: "border-orange-600",
    text: "text-white",
  },
  ACCOUNTING: {
    bg: "bg-sky-600",
    border: "border-sky-700",
    text: "text-white",
  },
  GUIDANCE: {
    bg: "bg-amber-400",
    border: "border-amber-500",
    text: "text-amber-950",
  },
  CSDL: {
    bg: "bg-violet-600",
    border: "border-violet-700",
    text: "text-white",
  },
  ADMIN: {
    bg: "bg-slate-700",
    border: "border-slate-800",
    text: "text-white",
  },
  FACULTY: {
    bg: "bg-lime-600",
    border: "border-lime-700",
    text: "text-white",
  },
  MARKETING: {
    bg: "bg-rose-500",
    border: "border-rose-600",
    text: "text-white",
  },
  OTHERS: {
    bg: "bg-teal-600",
    border: "border-teal-700",
    text: "text-white",
  },
};

type DutyEvent = {
  key: string;
  studentId: string;
  href: string;
  name: string;
  assignment: StudentAssignment;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  displayTime: string;
};

type PositionedDutyEvent = DutyEvent & {
  column: number;
  columnCount: number;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function buildDutyEvents(students: StudentScheduleMonitorRow[]): DutyEvent[] {
  const events: DutyEvent[] = [];

  for (const student of students) {
    for (const slot of student.weeklySchedule) {
      if (!slot.isEnabled) continue;

      const startMinutes = timeToMinutes(slot.startTime);
      const endMinutes = timeToMinutes(slot.endTime);
      if (endMinutes <= startMinutes) continue;

      events.push({
        key: `${student.id}-${slot.dayOfWeek}`,
        studentId: student.studentId,
        href: `/students/${student.id}`,
        name: `${student.firstName} ${student.lastName}`,
        assignment: student.assignment,
        dayOfWeek: slot.dayOfWeek,
        startMinutes,
        endMinutes,
        startTime: slot.startTime,
        endTime: slot.endTime,
        displayTime: slot.displayTime,
      });
    }
  }

  return events;
}

/** Pack overlapping events into side-by-side columns (Google Calendar style). */
function layoutDayEvents(events: DutyEvent[]): PositionedDutyEvent[] {
  const sorted = [...events].sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    return b.endMinutes - a.endMinutes;
  });

  const positioned: PositionedDutyEvent[] = [];
  let cluster: DutyEvent[] = [];
  let clusterEnd = -1;

  function flushCluster() {
    if (cluster.length === 0) return;

    const columnEnds: number[] = [];
    const withColumns = cluster.map((event) => {
      let column = columnEnds.findIndex((end) => end <= event.startMinutes);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(event.endMinutes);
      } else {
        columnEnds[column] = event.endMinutes;
      }
      return { ...event, column, columnCount: 0 };
    });

    const columnCount = columnEnds.length;
    for (const event of withColumns) {
      positioned.push({ ...event, columnCount });
    }

    cluster = [];
    clusterEnd = -1;
  }

  for (const event of sorted) {
    if (cluster.length > 0 && event.startMinutes >= clusterEnd) {
      flushCluster();
    }
    cluster.push(event);
    clusterEnd = Math.max(clusterEnd, event.endMinutes);
  }
  flushCluster();

  return positioned;
}

function getNowMinutesInManila(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0
  );
  return hour * 60 + minute;
}

type DutyWeekCalendarProps = {
  className?: string;
};

export function DutyWeekCalendar({ className }: DutyWeekCalendarProps) {
  const [weekAnchor, setWeekAnchor] = useState(() =>
    getManilaWeekStart(new Date())
  );
  const [data, setData] = useState<ScheduleMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowMinutes, setNowMinutes] = useState(() => getNowMinutesInManila());

  const weekStartKey = formatManilaDateInput(weekAnchor);
  const todayKey = formatManilaDateInput(new Date());
  const todayDayOfWeek = getManilaDayOfWeek(new Date());

  useEffect(() => {
    async function loadWeek() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/schedule/monitoring?date=${weekStartKey}`
        );
        const payload = await response.json();
        if (response.ok) {
          setData(payload);
        } else {
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadWeek();
  }, [weekStartKey]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMinutes(getNowMinutesInManila());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const weekDays = useMemo(
    () =>
      WEEKDAY_LABELS.map(({ dayOfWeek, label }) => {
        const date = addManilaDays(weekAnchor, dayOfWeek - 1);
        return {
          dayOfWeek,
          label,
          shortLabel: label.slice(0, 3).toUpperCase(),
          date,
          dateKey: formatManilaDateInput(date),
          dayNumber: Number(formatManilaDateInput(date).slice(8, 10)),
          isToday: formatManilaDateInput(date) === todayKey,
        };
      }),
    [weekAnchor, todayKey]
  );

  const eventsByDay = useMemo(() => {
    const events = data ? buildDutyEvents(data.students) : [];
    const map = new Map<number, PositionedDutyEvent[]>();

    for (const { dayOfWeek } of WEEKDAY_LABELS) {
      map.set(
        dayOfWeek,
        layoutDayEvents(events.filter((event) => event.dayOfWeek === dayOfWeek))
      );
    }

    return map;
  }, [data]);

  const { startHour, endHour } = useMemo(() => {
    const allEvents = [...eventsByDay.values()].flat();
    if (allEvents.length === 0) {
      return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
    }

    let earliest = Infinity;
    let latest = -Infinity;
    for (const event of allEvents) {
      earliest = Math.min(earliest, event.startMinutes);
      latest = Math.max(latest, event.endMinutes);
    }

    return {
      startHour: Math.max(0, Math.floor(earliest / 60) - 1),
      endHour: Math.min(24, Math.ceil(latest / 60) + 1),
    };
  }, [eventsByDay]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let hour = startHour; hour < endHour; hour += 1) {
      list.push(hour);
    }
    return list;
  }, [startHour, endHour]);

  const gridStartMinutes = startHour * 60;
  const gridEndMinutes = endHour * 60;
  const totalMinutes = gridEndMinutes - gridStartMinutes;
  const gridHeight = (totalMinutes / 60) * HOUR_HEIGHT;
  const weekNumber = getManilaWeekNumber(weekAnchor);
  const monthYear = formatManilaMonthYear(addManilaDays(weekAnchor, 2));
  const showNowLine =
    weekDays.some((day) => day.isToday) &&
    nowMinutes >= gridStartMinutes &&
    nowMinutes <= gridEndMinutes;
  const nowTop =
    ((nowMinutes - gridStartMinutes) / totalMinutes) * gridHeight;

  function goToPreviousWeek() {
    setWeekAnchor((current) => addManilaDays(current, -7));
  }

  function goToNextWeek() {
    setWeekAnchor((current) => addManilaDays(current, 7));
  }

  function goToThisWeek() {
    setWeekAnchor(getManilaWeekStart(new Date()));
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={goToPreviousWeek}
              aria-label="Previous week"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={goToNextWeek}
              aria-label="Next week"
            >
              <ChevronRight />
            </Button>
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight sm:text-lg">
              {monthYear}
            </p>
            <p className="text-xs text-muted-foreground">Week {weekNumber}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={goToThisWeek}>
            Today
          </Button>
        </div>

        {data && (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            {(
              Array.from(
                new Set(data.students.map((student) => student.assignment))
              ) as StudentAssignment[]
            ).map((assignment) => {
              const colors = ASSIGNMENT_COLORS[assignment];
              return (
                <span
                  key={assignment}
                  className="inline-flex items-center gap-1.5"
                >
                  <span
                    className={cn("size-2.5 rounded-sm", colors.bg)}
                    aria-hidden
                  />
                  {getStudentAssignmentLabel(assignment)}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {loading && !data ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          Loading duty week…
        </p>
      ) : !data ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          Failed to load duty schedule.
        </p>
      ) : (
        <TooltipProvider>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[56px_repeat(5,minmax(0,1fr))] border-b">
                <div className="border-r" />
                {weekDays.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className="flex flex-col items-center gap-1 border-r px-2 py-3 last:border-r-0"
                  >
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                      {day.shortLabel}
                    </span>
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center text-sm font-semibold",
                        day.isToday
                          ? "rounded-full bg-primary text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative grid grid-cols-[56px_repeat(5,minmax(0,1fr))]">
                <div
                  className="relative border-r"
                  style={{ height: gridHeight }}
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute right-2 -translate-y-1/2 text-[10px] text-muted-foreground"
                      style={{
                        top: ((hour * 60 - gridStartMinutes) / 60) * HOUR_HEIGHT,
                      }}
                    >
                      {formatHourLabel(hour)}
                    </div>
                  ))}
                </div>

                {weekDays.map((day) => {
                  const dayEvents = eventsByDay.get(day.dayOfWeek) ?? [];

                  return (
                    <div
                      key={day.dayOfWeek}
                      className="relative border-r last:border-r-0"
                      style={{ height: gridHeight }}
                    >
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="absolute inset-x-0 border-t border-border/70"
                          style={{
                            top:
                              ((hour * 60 - gridStartMinutes) / 60) *
                              HOUR_HEIGHT,
                          }}
                        />
                      ))}

                      {day.isToday && showNowLine && (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                          style={{ top: nowTop }}
                        >
                          <span className="size-2.5 -ml-1 shrink-0 rounded-full bg-red-500" />
                          <span className="h-0.5 w-full bg-red-500" />
                        </div>
                      )}

                      {dayEvents.map((event) => {
                        const top = Math.max(
                          0,
                          ((event.startMinutes - gridStartMinutes) /
                            totalMinutes) *
                            gridHeight
                        );
                        const height = Math.max(
                          MIN_BLOCK_HEIGHT,
                          ((event.endMinutes - event.startMinutes) /
                            totalMinutes) *
                            gridHeight -
                            2
                        );
                        const widthPercent = 100 / event.columnCount;
                        const leftPercent = event.column * widthPercent;
                        const colors = ASSIGNMENT_COLORS[event.assignment];
                        const timeLabel = `${formatScheduleTime(event.startTime)} – ${formatScheduleTime(event.endTime)}`;

                        return (
                          <Tooltip key={event.key}>
                            <TooltipTrigger
                              render={
                                <Link
                                  href={event.href}
                                  className={cn(
                                    "absolute z-10 overflow-hidden rounded-md border px-1.5 py-1 shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    colors.bg,
                                    colors.border,
                                    colors.text
                                  )}
                                  style={{
                                    top,
                                    height,
                                    left: `calc(${leftPercent}% + 2px)`,
                                    width: `calc(${widthPercent}% - 4px)`,
                                  }}
                                />
                              }
                            >
                              <p className="truncate text-[11px] leading-tight font-semibold">
                                {event.name}
                              </p>
                              {height >= 40 && (
                                <p className="truncate text-[10px] leading-tight opacity-90">
                                  {timeLabel}
                                </p>
                              )}
                              {height >= 56 && (
                                <p className="truncate text-[10px] leading-tight opacity-80">
                                  {getStudentAssignmentLabel(event.assignment)}
                                </p>
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-0.5">
                                <p className="font-medium">{event.name}</p>
                                <p>{timeLabel}</p>
                                <p>
                                  {getStudentAssignmentLabel(event.assignment)} ·{" "}
                                  {event.studentId}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}

                      {dayEvents.length === 0 && (
                        <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-6">
                          <span className="text-[10px] text-muted-foreground/60">
                            No duty
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TooltipProvider>
      )}

      {data && (
        <p className="text-xs text-muted-foreground">
          Showing {data.summary.totalActiveStudents} active students. Each block
          is a person on duty that day with their scheduled hours. Color =
          office assignment.{" "}
          {todayDayOfWeek >= 1 && todayDayOfWeek <= 5
            ? "The red line marks the current time on today’s column."
            : null}
        </p>
      )}
    </div>
  );
}
