import type { Department } from "@/generated/prisma/client";

export const ATTENDANCE_DEPARTMENTS = [
  "REGISTRAR",
  "FINANCE",
  "CSDL",
  "LIBRARY",
  "MARKETING",
  "GSD",
  "GUIDANCE",
  "ITSD",
] as const satisfies readonly Department[];

export const DEPARTMENT_LABELS: Record<Department, string> = {
  REGISTRAR: "Registrar",
  FINANCE: "Finance",
  CSDL: "CSDL",
  LIBRARY: "Library",
  MARKETING: "Marketing",
  GSD: "GSD",
  GUIDANCE: "Guidance",
  ITSD: "ITSD",
};

export function getDepartmentLabel(department: Department): string {
  return DEPARTMENT_LABELS[department];
}

export function isAttendanceDepartment(value: string): value is Department {
  return ATTENDANCE_DEPARTMENTS.includes(value as Department);
}
