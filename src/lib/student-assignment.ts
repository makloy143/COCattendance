export const STUDENT_ASSIGNMENTS = [
  "REGISTRAR",
  "FINANCE",
  "ACCOUNTING",
  "GUIDANCE",
  "CSDL",
  "ADMIN",
  "FACULTY",
  "MARKETING",
  "OTHERS",
] as const;

export type StudentAssignment = (typeof STUDENT_ASSIGNMENTS)[number];

export const STUDENT_ASSIGNMENT_LABELS: Record<StudentAssignment, string> = {
  REGISTRAR: "Registrar",
  FINANCE: "Finance",
  ACCOUNTING: "Accounting",
  GUIDANCE: "Guidance",
  CSDL: "CSDL",
  ADMIN: "Admin",
  FACULTY: "Faculty",
  MARKETING: "Marketing",
  OTHERS: "Others",
};

export function getStudentAssignmentLabel(
  assignment: StudentAssignment
): string {
  return STUDENT_ASSIGNMENT_LABELS[assignment];
}

export function isStudentAssignment(value: string): value is StudentAssignment {
  return STUDENT_ASSIGNMENTS.includes(value as StudentAssignment);
}
