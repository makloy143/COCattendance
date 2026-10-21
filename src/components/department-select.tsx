"use client";

import { useEffect, useRef, useState } from "react";
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
  const [loaded, setLoaded] = useState<string[] | null>(null);
  const choices = loaded && loaded.length > 0 ? loaded : [...DEPARTMENTS];
  const selected = choices.includes(value) ? value : choices[0];
  const onChangeRef = useRef(onValueChange);
  onChangeRef.current = onValueChange;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/inventory/departments")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as unknown;
        if (!cancelled && Array.isArray(data) && data.every((item) => typeof item === "string") && data.length > 0) {
          setLoaded(data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selected && selected !== value) onChangeRef.current(selected);
  }, [selected, value]);

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
        {choices.map((dept) => (
          <SelectItem key={dept} value={dept}>
            {dept}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
