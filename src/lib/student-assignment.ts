export const STUDENT_ASSIGNMENTS = ["COMLAB", "ID_STATION", "ITS_OFFICE"] as const;

export type StudentAssignment = (typeof STUDENT_ASSIGNMENTS)[number];

export const STUDENT_ASSIGNMENT_LABELS: Record<StudentAssignment, string> = {
  COMLAB: "COMLAB",
  ID_STATION: "ID STATION",
  ITS_OFFICE: "ITS OFFICE",
};

export function getStudentAssignmentLabel(
  assignment: StudentAssignment
): string {
  return STUDENT_ASSIGNMENT_LABELS[assignment];
}
