"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScheduleMonitoringStats,
  ScheduleMonitoringTable,
  ScheduleRecommendationsCard,
} from "@/components/schedule-monitoring-cards";
import type {
  ScheduleDutyStatus,
  ScheduleMonitoringData,
} from "@/lib/schedule-monitoring-shared";
import { formatManilaDateInput } from "@/lib/date-utils";

const STATUS_FILTERS: Array<{ value: "all" | ScheduleDutyStatus; label: string }> =
  [
    { value: "all", label: "All Active" },
    { value: "ABSENT", label: "Absent" },
    { value: "LATE", label: "Late" },
    { value: "WAITING", label: "Waiting" },
    { value: "UPCOMING", label: "Upcoming" },
    { value: "ON_TIME", label: "On Time" },
    { value: "COMPLETED", label: "Completed" },
    { value: "OFF_DUTY", label: "Off Duty" },
  ];

export default function ScheduleMonitoringPage() {
  const [data, setData] = useState<ScheduleMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ScheduleDutyStatus>(
    "all"
  );
  const [date, setDate] = useState(() => formatManilaDateInput(new Date()));

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/schedule/monitoring?date=${date}`);
        const payload = await response.json();
        if (response.ok) {
          setData(payload);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [date]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];

    return data.students.filter((student) => {
      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [data, search, statusFilter]);

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground">Loading schedule monitor...</p>;
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load schedule monitoring data.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Duty Schedule Monitor
          </h1>
          <p className="text-sm text-muted-foreground">
            Track active students against their weekly duty schedule. Late and
            absent arrivals are flagged automatically.
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="monitor-date" className="text-xs">
            Monitor date
          </Label>
          <Input
            id="monitor-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <ScheduleMonitoringStats summary={data.summary} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalActiveStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              Deactivated students are excluded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Waiting to Time In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.waiting}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled and within grace period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              No Schedule Set
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.noScheduleConfigured}
            </div>
            <p className="text-xs text-muted-foreground">
              Active students without duty days
            </p>
          </CardContent>
        </Card>
      </div>

      <ScheduleRecommendationsCard recommendations={data.recommendations} />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" />
            All Active Students
          </CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className="rounded-full"
              >
                <Badge
                  variant={statusFilter === filter.value ? "default" : "outline"}
                >
                  {filter.label}
                </Badge>
              </button>
            ))}
          </div>

          {filteredStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active students match this filter.
            </p>
          ) : (
            <ScheduleMonitoringTable students={filteredStudents} />
          )}

          <p className="text-xs text-muted-foreground">
            Late is recorded when a student times in more than 15 minutes after
            their scheduled start. Absent is recorded when no time in is logged
            after the grace period. Only{" "}
            <Link href="/students" className="text-primary hover:underline">
              active students
            </Link>{" "}
            appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
