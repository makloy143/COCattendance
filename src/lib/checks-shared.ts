export const CHECK_CADENCES = ["DAILY", "WEEKLY", "MONTHLY"] as const;
export type CheckCadenceValue = (typeof CHECK_CADENCES)[number];

export const CHECK_CATEGORIES = ["INK", "TECHNICAL", "OTHER"] as const;
export type CheckCategoryValue = (typeof CHECK_CATEGORIES)[number];

export const CHECK_STATUSES = [
  "PENDING",
  "COMPLETED",
  "ISSUE_FOUND",
  "SKIPPED",
] as const;
export type CheckStatusValue = (typeof CHECK_STATUSES)[number];

export const CADENCE_LABELS: Record<CheckCadenceValue, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

export const CATEGORY_LABELS: Record<CheckCategoryValue, string> = {
  INK: "Ink",
  TECHNICAL: "Technical",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<CheckStatusValue, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  ISSUE_FOUND: "Issue Found",
  SKIPPED: "Skipped",
};

export const WEEKDAY_OPTIONS = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 7, label: "Sunday" },
] as const;

export type CheckItemDto = {
  templateId: string;
  department: string;
  title: string;
  description: string | null;
  category: CheckCategoryValue;
  cadence: CheckCadenceValue;
  cadenceLabel: string;
  periodStart: string;
  urgency: "due_today" | "overdue";
  overdueSince: string | null;
  logId: string | null;
  logStatus: CheckStatusValue | null;
  logNotes: string | null;
  checkedBy: string | null;
};

export type CheckTemplateDto = {
  id: string;
  department: string;
  title: string;
  description: string | null;
  category: CheckCategoryValue;
  cadence: CheckCadenceValue;
  cadenceLabel: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  sortOrder: number;
  isActive: boolean;
};

export function formatCadenceSchedule(template: {
  cadence: CheckCadenceValue;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
}): string {
  switch (template.cadence) {
    case "DAILY":
      return "Every day";
    case "WEEKLY": {
      const day = WEEKDAY_OPTIONS.find((d) => d.dayOfWeek === template.dayOfWeek);
      return day ? `Every ${day.label}` : "Every week";
    }
    case "MONTHLY":
      return template.dayOfMonth
        ? `Day ${template.dayOfMonth} of each month`
        : "Every month";
    default:
      return CADENCE_LABELS[template.cadence];
  }
}

export const DEFAULT_CHECK_TEMPLATES = [
  {
    department: "COMLAB",
    title: "Check ink levels and cartridges",
    description: "Inspect all COMLAB printers for low ink and replace if needed.",
    category: "INK" as const,
    cadence: "WEEKLY" as const,
    dayOfWeek: 1,
    sortOrder: 1,
  },
  {
    department: "COMLAB",
    title: "Inspect printers for technical issues",
    description: "Check paper jams, error codes, connectivity, and print quality.",
    category: "TECHNICAL" as const,
    cadence: "DAILY" as const,
    sortOrder: 2,
  },
  {
    department: "COMLAB",
    title: "Verify network and PC workstations",
    description: "Confirm internet access, login issues, and hardware problems.",
    category: "TECHNICAL" as const,
    cadence: "WEEKLY" as const,
    dayOfWeek: 3,
    sortOrder: 3,
  },
  {
    department: "ITS OFFICE",
    title: "Review ink stock levels",
    description: "Count remaining ink supplies and note items below threshold.",
    category: "INK" as const,
    cadence: "MONTHLY" as const,
    dayOfMonth: 1,
    sortOrder: 4,
  },
  {
    department: "ITS OFFICE",
    title: "General equipment and technical walkthrough",
    description: "Walk through ITS office equipment for maintenance needs.",
    category: "OTHER" as const,
    cadence: "MONTHLY" as const,
    dayOfMonth: 15,
    sortOrder: 5,
  },
] as const;
