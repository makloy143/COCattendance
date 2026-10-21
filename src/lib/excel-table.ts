function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export type ExcelSection = {
  heading: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

export function buildExcelDocument(title: string, sections: ExcelSection[]) {
  const body = sections
    .map((section) => {
      const head = section.headers
        .map(
          (header) =>
            `<th style="background:#0e6b43;color:#fff;padding:6px;border:1px solid #ccc;">${escapeHtml(header)}</th>`
        )
        .join("");
      const rows =
        section.rows.length === 0
          ? `<tr><td colspan="${section.headers.length}" style="padding:6px;border:1px solid #ccc;">None</td></tr>`
          : section.rows
              .map((row) => {
                const cells = row
                  .map(
                    (cell) =>
                      `<td style="padding:6px;border:1px solid #ccc;">${escapeHtml(String(cell))}</td>`
                  )
                  .join("");
                return `<tr>${cells}</tr>`;
              })
              .join("");
      return `<h3>${escapeHtml(section.heading)}</h3><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body><h2>${escapeHtml(title)}</h2>${body}</body></html>`;
  return Buffer.from(html, "utf-8");
}
