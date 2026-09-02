"use client";

import { useEffect } from "react";
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
  const selected = value || DEPARTMENTS[0];

  useEffect(() => {
    if (!value) {
      onValueChange(DEPARTMENTS[0]);
    }
  }, [value, onValueChange]);

  return (
    <Select
      value={selected}
      onValueChange={(next) => {
        if (next) onValueChange(next);
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
