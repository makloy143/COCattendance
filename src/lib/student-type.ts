export const STUDENT_TYPES = ["SA", "HK"] as const;

export type StudentType = (typeof STUDENT_TYPES)[number];

export const STUDENT_TYPE_LABELS: Record<StudentType, string> = {
  SA: "Student Assistant (SA)",
  HK: "Hawak Kamay (HK)",
};

export function getStudentTypeLabel(type: StudentType): string {
  return STUDENT_TYPE_LABELS[type];
}
