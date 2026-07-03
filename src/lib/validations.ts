import { z } from "zod";
import { normalizeScheduleSlots } from "@/lib/schedule";
import { ITEM_TYPES, ITEM_CATEGORIES, INK_COLORS, ID_ERROR_STATUSES } from "@/lib/inventory";
import { STUDENT_ASSIGNMENTS } from "@/lib/student-assignment";
import { STUDENT_TYPES } from "@/lib/student-type";

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
  assignment: z.enum(STUDENT_ASSIGNMENTS, {
    message: "Assignment must be COMLAB, ID STATION, or ITS OFFICE",
  }),
});

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

export const attendanceScanSchema = z.object({
  qrToken: z.string().min(1, "QR code is required"),
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
