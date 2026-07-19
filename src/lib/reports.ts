import { prisma } from "@/lib/db";
import {
  formatDate,
  formatDuration,
  formatManilaDateInput,
  formatTime,
  getManilaDayEnd,
  getManilaDayStart,
} from "@/lib/date-utils";

export type ReportFilters = {
  from: Date;
  to: Date;
  studentId?: string;
  course?: string;
  status?: "all" | "complete" | "in_only" | "not_yet";
  department?: string;
};

export type ReportRow = {
  studentId: string;
  firstName: string;
  lastName: string;
  course: string;
  yearLevel: string;
  date: string;
  timeIn: string;
  timeOut: string;
  duration: string;
  status: string;
};

const STATUS_LABELS = {
  not_yet: "Not yet",
  in_only: "Timed in",
  complete: "Complete",
} as const;

function getStatus(timeIn: Date | null, timeOut: Date | null) {
  if (!timeIn) return STATUS_LABELS.not_yet;
  if (!timeOut) return STATUS_LABELS.in_only;
  return STATUS_LABELS.complete;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function parseReportDate(value: string, fallback: Date): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return getManilaDayStart(value);
  }
  return getManilaDayStart(fallback);
}

export async function fetchAttendanceReport(
  filters: ReportFilters
): Promise<ReportRow[]> {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      date: {
        gte: getManilaDayStart(filters.from),
        lte: getManilaDayEnd(filters.to),
      },
      student: {
        isActive: true,
        ...(filters.department ? { department: filters.department } : {}),
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.course
          ? { course: { contains: filters.course, mode: "insensitive" } }
          : {}),
      },
    },
    include: {
      student: {
        select: {
          studentId: true,
          firstName: true,
          lastName: true,
          course: true,
          yearLevel: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { student: { lastName: "asc" } }],
  });

  const rows = records.map((record) => ({
    studentId: record.student.studentId,
    firstName: record.student.firstName,
    lastName: record.student.lastName,
    course: record.student.course ?? "",
    yearLevel: record.student.yearLevel ?? "",
    date: formatManilaDateInput(record.date),
    timeIn: formatTime(record.timeIn),
    timeOut: formatTime(record.timeOut),
    duration: formatDuration(record.timeIn, record.timeOut),
    status: getStatus(record.timeIn, record.timeOut),
  }));

  if (!filters.status || filters.status === "all") return rows;

  const statusLabel =
    filters.status === "complete"
      ? STATUS_LABELS.complete
      : filters.status === "in_only"
        ? STATUS_LABELS.in_only
        : STATUS_LABELS.not_yet;

  return rows.filter((row) => row.status === statusLabel);
}

export function buildExcelBuffer(rows: ReportRow[], filters: ReportFilters): Buffer {
  const headers = [
    "Student ID",
    "First Name",
    "Last Name",
    "Course",
    "Year Level",
    "Date",
    "Time In",
    "Time Out",
    "Duration",
    "Status",
  ];

  const headerCells = headers
    .map(
      (header) =>
        `<th style="background:#166534;color:#fff;padding:6px;border:1px solid #ccc;">${escapeHtml(header)}</th>`
    )
    .join("");

  const bodyRows = rows
    .map((row) => {
      const cells = [
        row.studentId,
        row.firstName,
        row.lastName,
        row.course,
        row.yearLevel,
        row.date,
        row.timeIn,
        row.timeOut,
        row.duration,
        row.status,
      ]
        .map(
          (cell) =>
            `<td style="padding:6px;border:1px solid #ccc;">${escapeHtml(cell)}</td>`
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body><h2>COCiligan Attendance Report</h2><p>Period: ${escapeHtml(formatDate(filters.from))} - ${escapeHtml(formatDate(filters.to))}</p><p>Total records: ${rows.length}</p><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;

  return Buffer.from(html, "utf-8");
}

export function buildPdfBuffer(rows: ReportRow[], filters: ReportFilters): Buffer {
  const lines = [
    "COCiligan Attendance Report",
    `Period: ${formatDate(filters.from)} - ${formatDate(filters.to)}`,
    `Total records: ${rows.length}`,
    "",
    "ID           Name         Date         In           Out          Status",
    "-".repeat(80),
  ];

  for (const row of rows) {
    lines.push(
      [
        row.studentId.slice(0, 12).padEnd(13),
        `${row.firstName} ${row.lastName}`.slice(0, 12).padEnd(13),
        row.date.padEnd(13),
        row.timeIn.padEnd(13),
        row.timeOut.padEnd(13),
        row.status.slice(0, 12),
      ].join("")
    );
  }

  if (rows.length === 0) lines.push("No attendance records for the selected filters.");

  return buildSimplePdf(lines);
}

function buildSimplePdf(textLines: string[]): Buffer {
  let y = 780;
  const contentLines = textLines.map((line) => {
    const cmd = `BT /F1 10 Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`;
    y -= 14;
    return cmd;
  });

  const stream = contentLines.join("\n");
  const streamLength = Buffer.byteLength(stream, "utf-8");
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${streamLength} >>stream\n${stream}\nendstream endobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf-8"));
    pdf += `${obj}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf-8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf-8");
}

export function buildReportFilename(filters: ReportFilters, extension: "xls" | "pdf") {
  const from = formatManilaDateInput(filters.from);
  const to = formatManilaDateInput(filters.to);
  return `attendance-report_${from}_to_${to}.${extension}`;
}
