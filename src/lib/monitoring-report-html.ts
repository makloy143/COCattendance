import { format, parseISO } from "date-fns";
import {
  CATEGORY_LABELS,
  getCategoryBgColor,
  MONITORING_CATEGORIES,
  STATUS_BG_COLORS,
  type MonitoringCategory,
  type MonitoringShift,
  type MonitoringStatus,
} from "@/lib/monitoring-systems";

export type MonitoringReportHtmlInput = {
  reportDate: string;
  shiftType: MonitoringShift | string;
  entries: Array<{
    systemName: string;
    category: MonitoringCategory;
    sortOrder: number;
    status: string;
    accountNo: string;
    uptime: string;
    downtime: string;
    restoration: string;
    userExperience: string;
    remarks: string;
  }>;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function categoryBackground(
  category: MonitoringCategory,
  transparentCategoryBg: boolean
) {
  return getCategoryBgColor(category, { transparent: transparentCategoryBg });
}

function statusStyle(status: string) {
  const color =
    STATUS_BG_COLORS[status as MonitoringStatus] ?? STATUS_BG_COLORS.Up;
  return `background:${color};color:#fff;font-weight:bold;`;
}

function sortEntries<T extends { category: MonitoringCategory; sortOrder: number }>(
  entries: T[]
) {
  return [...entries].sort((a, b) => {
    const categoryDiff =
      MONITORING_CATEGORIES.indexOf(a.category) -
      MONITORING_CATEGORIES.indexOf(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return a.sortOrder - b.sortOrder;
  });
}

function verticalCategoryCell(label: string, bg: string, rowSpan: number) {
  return `<td rowspan="${rowSpan}" style="background:${bg};border:1px solid rgba(0,0,0,0.2);width:52px;min-width:52px;max-width:52px;padding:0;text-align:center;vertical-align:middle;">
    <div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:${rowSpan * 38}px;">
      <span style="display:inline-block;transform:rotate(-90deg);white-space:nowrap;font-size:10px;font-weight:bold;line-height:1.2;color:#000;">${escapeHtml(label)}</span>
    </div>
  </td>`;
}

function fieldCell(value: string, bg: string) {
  const content = value.trim() ? escapeHtml(value) : "&nbsp;";
  return `<td style="background:${bg};border:1px solid rgba(0,0,0,0.2);padding:4px;vertical-align:middle;">
    <div style="background:rgba(255,255,255,0.85);border:1px solid rgba(0,0,0,0.12);border-radius:6px;padding:6px 8px;min-height:18px;font-size:12px;line-height:1.2;">${content}</div>
  </td>`;
}

function statusCell(status: string, bg: string) {
  return `<td style="background:${bg};border:1px solid rgba(0,0,0,0.2);padding:4px;vertical-align:middle;">
    <div style="${statusStyle(status)}display:flex;align-items:center;justify-content:center;border-radius:6px;min-height:32px;padding:0 10px;font-size:12px;line-height:1;">${escapeHtml(status)}</div>
  </td>`;
}

function textCell(value: string, bg: string, bold = false) {
  return `<td style="background:${bg};border:1px solid rgba(0,0,0,0.2);padding:8px;font-size:12px;vertical-align:middle;${bold ? "font-weight:600;" : ""}">${escapeHtml(value)}</td>`;
}

export function buildMonitoringReportTableHtml(
  report: MonitoringReportHtmlInput,
  { transparentCategoryBg = false }: { transparentCategoryBg?: boolean } = {}
) {
  const reportDate = parseISO(report.reportDate);
  const formattedDate = format(reportDate, "EEEE, MMMM dd, yyyy");
  const sortedEntries = sortEntries(report.entries);

  const headerRow = `<tr>
    <td colspan="9" style="background:#166534;color:#fff;font-weight:bold;padding:12px 16px;border:0;">
      <table style="width:100%;border-collapse:collapse;border:0;">
        <tr>
          <td style="width:33%;border:0;background:#166534;color:#fff;">&nbsp;</td>
          <td style="width:34%;border:0;background:#166534;color:#fff;text-align:center;font-size:16px;font-weight:bold;">COC-ILIGAN - ${escapeHtml(report.shiftType)}</td>
          <td style="width:33%;border:0;background:#166534;color:#fff;text-align:right;font-size:13px;font-weight:bold;">${escapeHtml(formattedDate)}</td>
        </tr>
      </table>
    </td>
  </tr>`;

  const columnHeaders = [
    "",
    "System",
    "Status",
    "Account No.",
    "Uptime",
    "Downtime",
    "Restoration",
    "User Experience",
    "Remarks",
  ]
    .map(
      (header) =>
        `<th style="background:#f97316;color:#000;font-weight:bold;padding:8px 6px;border:1px solid rgba(0,0,0,0.2);font-size:12px;">${escapeHtml(header)}</th>`
    )
    .join("");

  const grouped = MONITORING_CATEGORIES.map((category) => ({
    category,
    entries: sortedEntries.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0);

  const bodyRows = grouped
    .map(({ category, entries }) => {
      const bg = categoryBackground(category, transparentCategoryBg);
      const label = CATEGORY_LABELS[category];

      return entries
        .map((entry, index) => {
          const cells = [
            textCell(entry.systemName, bg, true),
            statusCell(entry.status, bg),
            fieldCell(entry.accountNo, bg),
            fieldCell(entry.uptime, bg),
            fieldCell(entry.downtime, bg),
            fieldCell(entry.restoration, bg),
            fieldCell(entry.userExperience, bg),
            fieldCell(entry.remarks, bg),
          ].join("");

          if (index === 0) {
            return `<tr>
              ${verticalCategoryCell(label, bg, entries.length)}
              ${cells}
            </tr>`;
          }

          return `<tr>${cells}</tr>`;
        })
        .join("");
    })
    .join("");

  return `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:12px;min-width:1100px;width:1100px;border:1px solid rgba(0,0,0,0.2);border-radius:12px;overflow:hidden;">${headerRow}<tr>${columnHeaders}</tr>${bodyRows}</table>`;
}

export function buildMonitoringReportDocument(report: MonitoringReportHtmlInput) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8" /><style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    #monitoring-report-export { display: inline-block; }
    table { border-spacing: 0; }
  </style></head><body><div id="monitoring-report-export">${buildMonitoringReportTableHtml(report, { transparentCategoryBg: true })}</div></body></html>`;
}
