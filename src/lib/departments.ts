import { humanizeOptionCode } from "@/lib/option-code";

export type Department = string;

/** Built-in defaults used for seed and offline fallbacks. */
export const DEFAULT_ATTENDANCE_DEPARTMENTS = [
  { code: "REGISTRAR", label: "Registrar" },
  { code: "FINANCE", label: "Finance" },
  { code: "CSDL", label: "CSDL" },
  { code: "LIBRARY", label: "Library" },
  { code: "MARKETING", label: "Marketing" },
  { code: "GSD", label: "GSD" },
  { code: "GUIDANCE", label: "Guidance" },
  { code: "ITSD", label: "ITSD" },
] as const;

export const ATTENDANCE_DEPARTMENTS = DEFAULT_ATTENDANCE_DEPARTMENTS.map(
  (item) => item.code
);

export const DEPARTMENT_LABELS: Record<string, string> = Object.fromEntries(
  DEFAULT_ATTENDANCE_DEPARTMENTS.map((item) => [item.code, item.label])
);

export function getDepartmentLabel(
  department: string,
  labels?: Record<string, string>
): string {
  return (
    labels?.[department] ??
    DEPARTMENT_LABELS[department] ??
    humanizeOptionCode(department)
  );
}

export function isAttendanceDepartment(
  value: string,
  activeCodes?: readonly string[]
): boolean {
  const codes = activeCodes ?? ATTENDANCE_DEPARTMENTS;
  return codes.includes(value);
}
