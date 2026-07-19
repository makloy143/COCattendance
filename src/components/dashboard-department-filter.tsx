"use client";

import { useRouter, usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type DepartmentOption = {
  code: string;
  label: string;
};

const ALL_VALUE = "__all__";

export function DashboardDepartmentFilter({
  departments,
  selectedDepartment,
}: {
  departments: DepartmentOption[];
  selectedDepartment: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams();
    if (value !== ALL_VALUE) {
      params.set("department", value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Label
        htmlFor="dashboard-department"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Building2 className="size-3.5" />
        Department dashboard
      </Label>
      <Select
        value={selectedDepartment ?? ALL_VALUE}
        onValueChange={handleChange}
      >
        <SelectTrigger id="dashboard-department" className="w-full sm:w-64">
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
