import { z } from "zod";
import { normalizeScheduleSlots } from "@/lib/schedule";
import { ITEM_TYPES, ITEM_CATEGORIES, INK_COLORS, ID_ERROR_STATUSES } from "@/lib/inventory";
import { STUDENT_TYPES } from "@/lib/student-type";
import { TODO_PRIORITIES } from "@/lib/todo";
import { toOptionCode } from "@/lib/option-code";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const scheduleSlotSchema = z
  .object({
    dayOfWeek: z.number().int().min(1).max(5),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time"),
    isEnabled: z.boolean(),
  })
  .refine((slot) => !slot.isEnabled || slot.startTime < slot.endTime, {
    message: "End time must be after start time",
  });

export const scheduleSchema = z.array(scheduleSlotSchema).length(5);

export type ScheduleSlotValues = z.infer<typeof scheduleSlotSchema>;

export const studentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required").max(50),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  course: z.string().max(100).optional().or(z.literal("")),
  yearLevel: z.string().max(50).optional().or(z.literal("")),
  studentType: z.enum(STUDENT_TYPES, {
    message: "Student type must be SA or HK",
  }),
  assignment: z.string().min(1, "Assignment is required").max(50),
  department: z.string().min(1, "Department is required").max(50),
});

export const catalogOptionSchema = z.object({
  label: z.string().min(1, "Label is required").max(80),
  code: z.string().max(50).optional(),
});

export const catalogOptionUpdateSchema = z.object({
  label: z.string().min(1, "Label is required").max(80).optional(),
  isActive: z.boolean().optional(),
});

export function resolveCatalogOptionCode(label: string, code?: string | null) {
  const resolved = toOptionCode(code?.trim() || label);
  if (!resolved) {
    return null;
  }
  return resolved;
}

export type StudentFormValues = z.infer<typeof studentSchema>;

export function parseScheduleFromFormData(formData: FormData) {
  const rawValue = formData.get("schedule");
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return { success: false as const, error: "Schedule is required" };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawValue);
  } catch {
    return { success: false as const, error: "Invalid schedule format" };
  }

  if (!Array.isArray(parsedJson)) {
    return { success: false as const, error: "Invalid schedule format" };
  }

  const normalized = normalizeScheduleSlots(
    parsedJson as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isEnabled: boolean;
    }[]
  );

  const parsed = scheduleSchema.safeParse(normalized);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid schedule",
    };
  }

  return { success: true as const, data: parsed.data };
}

export const attendanceActionSchema = z.object({
  studentId: z.string().min(1),
  action: z.enum(["timeIn", "timeOut"]),
});

export const attendanceResetSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
});

export const attendanceScanSchema = z.object({
  qrToken: z.string().min(1, "QR code is required"),
});

export const attendanceRecognizeSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
});

export const faceEnrollSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  descriptor: z
    .array(z.number().finite())
    .length(128, "Face descriptor must have 128 values"),
});

export const faceEnrollBatchSchema = z.object({
  enrollments: z
    .array(faceEnrollSchema)
    .min(1, "At least one enrollment is required"),
});

export const receivedItemSchema = z
  .object({
    itemName: z.string().min(1, "Item name is required").max(200),
    itemType: z.enum(ITEM_TYPES, {
      message: "Item type must be Consumable or Equipment",
    }),
    category: z.enum(ITEM_CATEGORIES, {
      message: "Category is required",
    }),
    inkColor: z.enum(INK_COLORS).optional().or(z.literal("")),
    brand: z.string().max(100).optional().or(z.literal("")),
    model: z.string().max(100).optional().or(z.literal("")),
    color: z.string().max(50).optional().or(z.literal("")),
    serialNumber: z.string().max(100).optional().or(z.literal("")),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    senderName: z.string().min(1, "Received by is required").max(200),
    senderSource: z.string().min(1, "Sender source is required").max(200),
    receivedByDepartment: z
      .string()
      .min(1, "Department is required")
      .max(200),
    dateReceived: z.string().min(1, "Date received is required"),
    notes: z.string().max(500).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.itemType === "EQUIPMENT") {
      if (data.quantity !== 1) {
        ctx.addIssue({
          code: "custom",
          message: "Equipment must have quantity of 1",
          path: ["quantity"],
        });
      }
      if (!data.serialNumber?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Serial number is required for equipment",
          path: ["serialNumber"],
        });
      }
    }
    if (data.category === "INK" && !data.inkColor) {
      ctx.addIssue({
        code: "custom",
        message: "Ink color is required for ink items",
        path: ["inkColor"],
      });
    }
  });

export type ReceivedItemFormValues = z.infer<typeof receivedItemSchema>;

export const borrowRecordSchema = z
  .object({
    receivedItemId: z.string().min(1, "Item is required"),
    borrowerName: z.string().min(1, "Borrower name is required").max(200),
    department: z.string().min(1, "Department is required").max(200),
    quantityBorrowed: z.coerce
      .number()
      .int()
      .min(1, "Quantity must be at least 1"),
    dateBorrowed: z.string().min(1, "Borrow date is required"),
    timeBorrowed: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Invalid time")
      .optional()
      .or(z.literal("")),
    dueDate: z.string().optional().or(z.literal("")),
    signatureConfirmed: z.boolean().optional(),
    notes: z.string().max(500).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.signatureConfirmed === false) {
      ctx.addIssue({
        code: "custom",
        message: "Signature confirmation is required",
        path: ["signatureConfirmed"],
      });
    }
  });

export type BorrowRecordFormValues = z.infer<typeof borrowRecordSchema>;

export const returnBorrowSchema = z.object({
  dateReturned: z.string().min(1, "Return date is required"),
  timeReturned: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time")
    .optional()
    .or(z.literal("")),
  returnerName: z.string().min(1, "Return by name is required").max(200),
  receivedByName: z.string().min(1, "Received by is required").max(200),
});

export const idErrorRecordSchema = z.object({
  personName: z.string().min(1, "Name is required").max(200),
  course: z.string().min(1, "Course is required").max(100),
  idNumber: z.string().min(1, "ID number is required").max(50),
  datePrintedError: z.string().min(1, "Date is required"),
  status: z.enum(ID_ERROR_STATUSES).default("REPRINT"),
  reason: z.string().min(1, "Reason is required").max(500),
  notes: z.string().max(500).optional().or(z.literal("")),
  studentId: z.string().optional().or(z.literal("")),
});

export type IdErrorRecordFormValues = z.infer<typeof idErrorRecordSchema>;

export const idErrorStatusUpdateSchema = z.object({
  status: z.enum(ID_ERROR_STATUSES),
});

export const monitoringEntrySchema = z.object({
  systemId: z.string().min(1),
  status: z.enum(["Up", "With Degradation", "Down"]),
  accountNo: z.string().max(100).optional().or(z.literal("")),
  uptime: z.string().max(100).optional().or(z.literal("")),
  downtime: z.string().max(200).optional().or(z.literal("")),
  restoration: z.string().max(200).optional().or(z.literal("")),
  userExperience: z.string().max(200).optional().or(z.literal("")),
  remarks: z.string().max(500).optional().or(z.literal("")),
});

export const monitoringSaveSchema = z.object({
  date: z.string().min(1, "Date is required"),
  shiftType: z.enum(["IN", "OUT"]).default("IN"),
  entries: z.array(monitoringEntrySchema).min(1),
});

export type MonitoringSaveInput = z.infer<typeof monitoringSaveSchema>;

export const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  priority: z.enum(TODO_PRIORITIES).default("MEDIUM"),
  dueDate: z.string().optional().or(z.literal("")),
});

export type TodoFormValues = z.infer<typeof todoSchema>;

export const todoUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  priority: z.enum(TODO_PRIORITIES).optional(),
  dueDate: z.string().optional().or(z.literal("")).nullable(),
  isDone: z.boolean().optional(),
});

export const CHECK_CADENCES = ["DAILY", "WEEKLY", "MONTHLY"] as const;
export const CHECK_CATEGORIES = ["INK", "TECHNICAL", "OTHER"] as const;
export const CHECK_STATUSES = [
  "PENDING",
  "COMPLETED",
  "ISSUE_FOUND",
  "SKIPPED",
] as const;

const checkTemplateBaseSchema = z.object({
  department: z.string().min(1, "Department is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  category: z.enum(CHECK_CATEGORIES).default("OTHER"),
  cadence: z.enum(CHECK_CADENCES).default("WEEKLY"),
  dayOfWeek: z.number().int().min(1).max(7).optional().nullable(),
  dayOfMonth: z.number().int().min(1).max(28).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const checkTemplateSchema = checkTemplateBaseSchema.superRefine(
  (data, ctx) => {
    if (data.cadence === "WEEKLY" && !data.dayOfWeek) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Day of week is required for weekly checks",
        path: ["dayOfWeek"],
      });
    }
    if (data.cadence === "MONTHLY" && !data.dayOfMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Day of month is required for monthly checks",
        path: ["dayOfMonth"],
      });
    }
  }
);

export type CheckTemplateFormValues = z.infer<typeof checkTemplateSchema>;

export const checkTemplateUpdateSchema = checkTemplateBaseSchema.partial();

export const checkLogSchema = z.object({
  templateId: z.string().min(1),
  periodStart: z.string().min(1, "Period date is required"),
  status: z.enum(CHECK_STATUSES),
  notes: z.string().max(1000).optional().or(z.literal("")),
  checkedBy: z.string().max(100).optional().or(z.literal("")),
});

export type CheckLogInput = z.infer<typeof checkLogSchema>;

export const adminAccountSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100),
    role: z.enum(["ADMIN", "SUPER_ADMIN"]),
    department: z.string().min(1).max(50).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "ADMIN" && !data.department) {
      ctx.addIssue({
        code: "custom",
        message: "Department is required for admin accounts",
        path: ["department"],
      });
    }
    if (data.role === "SUPER_ADMIN" && data.department) {
      ctx.addIssue({
        code: "custom",
        message: "Super admin accounts cannot be assigned to a department",
        path: ["department"],
      });
    }
  });

export const adminAccountUpdateSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100)
      .optional(),
    role: z.enum(["ADMIN", "SUPER_ADMIN"]).optional(),
    department: z.string().min(1).max(50).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "ADMIN" && data.department === null) {
      ctx.addIssue({
        code: "custom",
        message: "Department is required for admin accounts",
        path: ["department"],
      });
    }
    if (data.role === "SUPER_ADMIN" && data.department) {
      ctx.addIssue({
        code: "custom",
        message: "Super admin accounts cannot be assigned to a department",
        path: ["department"],
      });
    }
  });
