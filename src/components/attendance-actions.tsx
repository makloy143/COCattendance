"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LogIn, LogOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceStatusBadge } from "@/components/attendance-status-badge";
import { formatTime } from "@/lib/date-utils";

type AttendanceActionsProps = {
  studentId: string;
  timeIn?: Date | string | null;
  timeOut?: Date | string | null;
  onUpdate?: () => void;
  compact?: boolean;
  fullWidth?: boolean;
  canReset?: boolean;
};

export function AttendanceActions({
  studentId,
  timeIn,
  timeOut,
  onUpdate,
  compact = false,
  fullWidth = false,
  canReset = false,
}: AttendanceActionsProps) {
  const [loading, setLoading] = useState<"timeIn" | "timeOut" | "reset" | null>(
    null
  );

  const isCompleted = Boolean(timeIn && timeOut);
  const showReset = canReset && isCompleted;

  async function recordAttendance(action: "timeIn" | "timeOut") {
    setLoading(action);
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to record attendance");
        return;
      }

      toast.success(data.message);
      onUpdate?.();
    } catch {
      toast.error("Failed to record attendance");
    } finally {
      setLoading(null);
    }
  }

  async function resetAttendance() {
    if (
      !window.confirm(
        "Reset today's completed attendance for this student? They will be able to time in again."
      )
    ) {
      return;
    }

    setLoading("reset");
    try {
      const response = await fetch("/api/attendance", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to reset attendance");
        return;
      }

      toast.success(data.message);
      onUpdate?.();
    } catch {
      toast.error("Failed to reset attendance");
    } finally {
      setLoading(null);
    }
  }

  if (compact) {
    return (
      <div
        className={
          fullWidth
            ? showReset
              ? "grid grid-cols-1 gap-2"
              : "grid grid-cols-2 gap-2"
            : "flex justify-end gap-2"
        }
      >
        {showReset ? (
          <Button
            size="sm"
            variant="outline"
            className={fullWidth ? "w-full" : undefined}
            onClick={resetAttendance}
            disabled={loading !== null}
          >
            <RotateCcw className="size-4" />
            {loading === "reset" ? "Resetting..." : "Reset"}
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              className={fullWidth ? "w-full" : undefined}
              onClick={() => recordAttendance("timeIn")}
              disabled={Boolean(timeIn) || loading !== null}
            >
              <LogIn className="size-4" />
              In
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className={fullWidth ? "w-full" : undefined}
              onClick={() => recordAttendance("timeOut")}
              disabled={!timeIn || Boolean(timeOut) || loading !== null}
            >
              <LogOut className="size-4" />
              Out
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Today&apos;s attendance</p>
          <div className="mt-1">
            <AttendanceStatusBadge timeIn={timeIn} timeOut={timeOut} />
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>In: {formatTime(timeIn)}</span>
          <span>Out: {formatTime(timeOut)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => recordAttendance("timeIn")}
          disabled={Boolean(timeIn) || loading !== null}
        >
          <LogIn className="size-4" />
          {loading === "timeIn" ? "Recording..." : "Time In"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => recordAttendance("timeOut")}
          disabled={!timeIn || Boolean(timeOut) || loading !== null}
        >
          <LogOut className="size-4" />
          {loading === "timeOut" ? "Recording..." : "Time Out"}
        </Button>
        {showReset && (
          <Button
            variant="outline"
            onClick={resetAttendance}
            disabled={loading !== null}
          >
            <RotateCcw className="size-4" />
            {loading === "reset" ? "Resetting..." : "Reset Attendance"}
          </Button>
        )}
      </div>
    </div>
  );
}
