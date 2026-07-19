import { humanizeOptionCode } from "@/lib/option-code";

export type StudentAssignment = string;

/** Built-in defaults used for seed and offline fallbacks. */
export const DEFAULT_STUDENT_ASSIGNMENTS = [
  { code: "REGISTRAR", label: "Registrar" },
  { code: "FINANCE", label: "Finance" },
  { code: "ACCOUNTING", label: "Accounting" },
  { code: "GUIDANCE", label: "Guidance" },
  { code: "CSDL", label: "CSDL" },
  { code: "ADMIN", label: "Admin" },
  { code: "FACULTY", label: "Faculty" },
  { code: "MARKETING", label: "Marketing" },
  { code: "OTHERS", label: "Others" },
] as const;

export const STUDENT_ASSIGNMENTS = DEFAULT_STUDENT_ASSIGNMENTS.map(
  (item) => item.code
);

export const STUDENT_ASSIGNMENT_LABELS: Record<string, string> = Object.fromEntries(
  DEFAULT_STUDENT_ASSIGNMENTS.map((item) => [item.code, item.label])
);

export function getStudentAssignmentLabel(
  assignment: string,
  labels?: Record<string, string>
): string {
  return (
    labels?.[assignment] ??
    STUDENT_ASSIGNMENT_LABELS[assignment] ??
    humanizeOptionCode(assignment)
  );
}

export function isStudentAssignment(
  value: string,
  activeCodes?: readonly string[]
): boolean {
  const codes = activeCodes ?? STUDENT_ASSIGNMENTS;
  return codes.includes(value);
}
