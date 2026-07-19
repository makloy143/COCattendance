"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

type DutyEvent = {
  key: string;
  studentId: string;
  href: string;
  name: string;
  assignment: StudentAssignment;
  dayOfWeek: number;
  startMinutes: number;
  startTime: string;
  endTime: string;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
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
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }
  }

  return events.sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    return a.name.localeCompare(b.name);
  });
}

function DutyPersonCard({ event }: { event: DutyEvent }) {
  const timeLabel = `${formatScheduleTime(event.startTime)} – ${formatScheduleTime(event.endTime)}`;

  return (
    <Link
      href={event.href}
      className="block rounded-lg border border-primary/20 bg-primary/10 px-3 py-2.5 text-foreground shadow-sm transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className="truncate text-[11px] leading-tight font-semibold tracking-wide uppercase text-primary sm:text-xs">
        {event.name}
      </p>
      <p className="mt-0.5 truncate text-[11px] leading-tight text-foreground/80">
        {timeLabel}
      </p>
      <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
        {getStudentAssignmentLabel(event.assignment)} · {event.studentId}
      </p>
    </Link>
  );
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
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = getManilaDayOfWeek(new Date());
    return today >= 1 && today <= 5 ? today : 1;
  });

  const weekStartKey = formatManilaDateInput(weekAnchor);
  const todayKey = formatManilaDateInput(new Date());

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

  const weekDays = useMemo(
    () =>
      WEEKDAY_LABELS.map(({ dayOfWeek, label }) => {
        const date = addManilaDays(weekAnchor, dayOfWeek - 1);
        return {
          dayOfWeek,
          label,
          shortLabel: label.slice(0, 3).toUpperCase(),
          dateKey: formatManilaDateInput(date),
          dayNumber: Number(formatManilaDateInput(date).slice(8, 10)),
          isToday: formatManilaDateInput(date) === todayKey,
        };
      }),
    [weekAnchor, todayKey]
  );

  const eventsByDay = useMemo(() => {
    const events = data ? buildDutyEvents(data.students) : [];
    const map = new Map<number, DutyEvent[]>();

    for (const { dayOfWeek } of WEEKDAY_LABELS) {
      map.set(
        dayOfWeek,
        events.filter((event) => event.dayOfWeek === dayOfWeek)
      );
    }

    return map;
  }, [data]);

  const weekNumber = getManilaWeekNumber(weekAnchor);
  const monthYear = formatManilaMonthYear(addManilaDays(weekAnchor, 2));
  const mobileDay = weekDays.find((day) => day.dayOfWeek === selectedDay);
  const mobileEvents = eventsByDay.get(selectedDay) ?? [];

  function goToPreviousWeek() {
    setWeekAnchor((current) => addManilaDays(current, -7));
  }

  function goToNextWeek() {
    setWeekAnchor((current) => addManilaDays(current, 7));
  }

  function goToThisWeek() {
    const today = getManilaDayOfWeek(new Date());
    setWeekAnchor(getManilaWeekStart(new Date()));
    setSelectedDay(today >= 1 && today <= 5 ? today : 1);
  }

  return (
    <div className={cn("space-y-4", className)}>
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold tracking-tight sm:text-lg">
            {monthYear}
          </p>
          <p className="text-xs text-muted-foreground">Week {weekNumber}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={goToThisWeek}>
          Today
        </Button>
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
        <>
          {/* Mobile: one day at a time */}
          <div className="space-y-3 md:hidden">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {weekDays.map((day) => {
                const count = (eventsByDay.get(day.dayOfWeek) ?? []).length;
                const active = selectedDay === day.dayOfWeek;

                return (
                  <button
                    key={day.dayOfWeek}
                    type="button"
                    onClick={() => setSelectedDay(day.dayOfWeek)}
                    className={cn(
                      "flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-xl border px-2 py-2 transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card hover:bg-muted"
                    )}
                  >
                    <span className="text-[10px] font-medium tracking-wide opacity-80">
                      {day.shortLabel}
                    </span>
                    <span className="text-sm font-semibold">{day.dayNumber}</span>
                    <span className="text-[10px] opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border bg-card p-3">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">
                  {mobileDay?.label} {mobileDay?.dayNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mobileEvents.length} on duty
                </p>
              </div>
              {mobileEvents.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No duty scheduled
                </p>
              ) : (
                <div className="space-y-2">
                  {mobileEvents.map((event) => (
                    <DutyPersonCard key={event.key} event={event} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop / tablet: full week grid */}
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <div className="grid grid-cols-5">
              {weekDays.map((day) => {
                const dayEvents = eventsByDay.get(day.dayOfWeek) ?? [];

                return (
                  <div
                    key={day.dayOfWeek}
                    className="min-w-0 border-r last:border-r-0"
                  >
                    <div className="flex flex-col items-center gap-1 border-b px-2 py-3">
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
                      <span className="text-[10px] text-muted-foreground">
                        {dayEvents.length} on duty
                      </span>
                    </div>

                    <div className="space-y-2 p-2">
                      {dayEvents.length === 0 ? (
                        <p className="py-6 text-center text-[11px] text-muted-foreground/70">
                          No duty
                        </p>
                      ) : (
                        dayEvents.map((event) => (
                          <DutyPersonCard key={event.key} event={event} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {data && (
        <p className="text-xs text-muted-foreground">
          Showing {data.summary.totalActiveStudents} active students. Each card
          is a person on duty that day with their scheduled hours.
        </p>
      )}
    </div>
  );
}
