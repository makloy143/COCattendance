"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "@/lib/inventory";

type DepartmentSelectProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
};

export function DepartmentSelect({
  id,
  value,
  onValueChange,
  placeholder = "Select department",
}: DepartmentSelectProps) {
  return (
    <Select
      value={value || DEPARTMENTS[0]}
      onValueChange={(v) => {
        if (v) onValueChange(v);
      }}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {DEPARTMENTS.map((dept) => (
          <SelectItem key={dept} value={dept}>
            {dept}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
