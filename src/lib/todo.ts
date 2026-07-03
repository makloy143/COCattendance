export const TODO_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};
