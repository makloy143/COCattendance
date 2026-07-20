"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DepartmentOption = {
  code: string;
  label: string;
};

const ALL_VALUE = "__all__";

export function DepartmentScopeFilter({
  departments,
  selectedDepartment,
  className,
  compact = false,
}: {
  departments: DepartmentOption[];
  selectedDepartment: string | null;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  async function handleChange(value: string | null) {
    if (!value || saving) return;

    setSaving(true);
    try {
      const response = await fetch("/api/department-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: value === ALL_VALUE ? null : value,
        }),
      });

      if (!response.ok) {
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compact ? "min-w-0" : "flex-col gap-2 sm:flex-row sm:gap-3",
        className
      )}
    >
      {!compact ? (
        <Label
          htmlFor="department-scope"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Building2 className="size-3.5" />
          Department
        </Label>
      ) : (
        <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <Select
        value={selectedDepartment ?? ALL_VALUE}
        onValueChange={handleChange}
        disabled={saving || pending}
      >
        <SelectTrigger
          id="department-scope"
          className={cn(compact ? "h-8 w-[9.5rem] sm:w-44" : "w-full sm:w-64")}
          size={compact ? "sm" : "default"}
        >
          <SelectValue placeholder="All departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All departments</SelectItem>
          {departments.map((department) => (
            <SelectItem key={department.code} value={department.code}>
              {department.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
