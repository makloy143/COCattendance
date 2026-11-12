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
            `<td style="padding:6px;border:1px solid #ccc;mso-number-format:'\\@';">${escapeHtml(cell)}</td>`
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body><h2>COCiligan Attendance Report</h2><p>Period: ${escapeHtml(formatDate(filters.from))} - ${escapeHtml(formatDate(filters.to))}</p><p>Total records: ${rows.length}</p><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;

  return Buffer.from(html, "utf-8");
}

const PDF_ROWS_PER_PAGE = 44;

export function buildPdfBuffer(rows: ReportRow[], filters: ReportFilters): Buffer {
  const pageCount = Math.max(1, Math.ceil(rows.length / PDF_ROWS_PER_PAGE));
  const pages: string[][] = [];

  for (let page = 0; page < pageCount; page += 1) {
    const lines = [
      "COCiligan Attendance Report",
      `Period: ${formatDate(filters.from)} - ${formatDate(filters.to)}`,
      `Total records: ${rows.length}     Page ${page + 1} of ${pageCount}`,
      "",
      "ID".padEnd(13) + "Name".padEnd(23) + "Date".padEnd(14) + "In".padEnd(10) + "Out".padEnd(10) + "Status",
      "-".repeat(82),
    ];

    const pageRows = rows.slice(page * PDF_ROWS_PER_PAGE, (page + 1) * PDF_ROWS_PER_PAGE);
    for (const row of pageRows) {
      lines.push(
        [
          row.studentId.slice(0, 12).padEnd(13),
          `${row.firstName} ${row.lastName}`.slice(0, 22).padEnd(23),
          row.date.slice(0, 13).padEnd(14),
          row.timeIn.slice(0, 9).padEnd(10),
          row.timeOut.slice(0, 9).padEnd(10),
          row.status.slice(0, 12),
        ].join("")
      );
    }

    if (rows.length === 0) lines.push("No attendance records for the selected filters.");
    pages.push(lines);
  }

  return buildSimplePdf(pages);
}

// The built-in PDF fonts only cover single-byte WinAnsi text, so anything
// outside Latin-1 is replaced rather than written as garbled UTF-8 bytes.
function toPdfText(value: string): string {
  const latin = value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
  return escapePdfText(latin);
}

function buildSimplePdf(pages: string[][]): Buffer {
  const FONT_OBJECT = 3;
  const pageObjectNumber = (index: number) => 4 + index * 2;

  const objects: string[] = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    `2 0 obj<< /Type /Pages /Kids [${pages
      .map((_, index) => `${pageObjectNumber(index)} 0 R`)
      .join(" ")}] /Count ${pages.length} >>endobj`,
    // Courier keeps the padded columns aligned.
    `${FONT_OBJECT} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>endobj`,
  ];

  pages.forEach((lines, index) => {
    let y = 760;
    const stream = lines
      .map((line) => {
        const cmd = `BT /F1 9 Tf 50 ${y} Td (${toPdfText(line)}) Tj ET`;
        y -= 14;
        return cmd;
      })
      .join("\n");
    const pageNumber = pageObjectNumber(index);
    objects.push(
      `${pageNumber} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${pageNumber + 1} 0 R /Resources << /Font << /F1 ${FONT_OBJECT} 0 R >> >> >>endobj`,
      `${pageNumber + 1} 0 obj<< /Length ${Buffer.byteLength(stream, "latin1")} >>stream\n${stream}\nendstream endobj`
    );
  });

  // Every character is single-byte here, so string length equals byte offset.
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

export function buildReportFilename(filters: ReportFilters, extension: "xls" | "pdf") {
  const from = formatManilaDateInput(filters.from);
  const to = formatManilaDateInput(filters.to);
  return `attendance-report_${from}_to_${to}.${extension}`;
}
