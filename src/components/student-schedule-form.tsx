"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createDefaultSchedule,
  normalizeTimeString,
  WEEKDAY_LABELS,
  type ScheduleSlot,
} from "@/lib/schedule";

type StudentScheduleFormProps = {
  value: ScheduleSlot[];
  onChange: (schedule: ScheduleSlot[]) => void;
};

export function StudentScheduleForm({
  value,
  onChange,
}: StudentScheduleFormProps) {
  function updateSlot(
    dayOfWeek: number,
    patch: Partial<Pick<ScheduleSlot, "startTime" | "endTime" | "isEnabled">>
  ) {
    onChange(
      value.map((slot) =>
        slot.dayOfWeek === dayOfWeek ? { ...slot, ...patch } : slot
      )
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Weekly Schedule</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set available days and times for Monday through Friday.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {WEEKDAY_LABELS.map(({ dayOfWeek, label }) => {
          const slot =
            value.find((entry) => entry.dayOfWeek === dayOfWeek) ??
            createDefaultSchedule().find((entry) => entry.dayOfWeek === dayOfWeek)!;

          return (
            <div
              key={dayOfWeek}
              className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[140px_1fr_1fr]"
            >
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={slot.isEnabled}
                  onChange={(event) =>
                    updateSlot(dayOfWeek, { isEnabled: event.target.checked })
                  }
                  className="size-4 rounded border-input accent-primary"
                />
                {label}
              </label>
              <div className="space-y-1">
                <Label htmlFor={`start-${dayOfWeek}`} className="text-xs">
                  Start
                </Label>
                <Input
                  id={`start-${dayOfWeek}`}
                  type="time"
                  value={slot.startTime}
                  disabled={!slot.isEnabled}
                  onChange={(event) =>
                    updateSlot(dayOfWeek, {
                      startTime: normalizeTimeString(event.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`end-${dayOfWeek}`} className="text-xs">
                  End
                </Label>
                <Input
                  id={`end-${dayOfWeek}`}
                  type="time"
                  value={slot.endTime}
                  disabled={!slot.isEnabled}
                  onChange={(event) =>
                    updateSlot(dayOfWeek, {
                      endTime: normalizeTimeString(event.target.value),
                    })
                  }
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
