import ExcelJS from "exceljs";

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const r of rows) {
    lines.push(r.map(escape).join(","));
  }
  return lines.join("\n");
}

export async function toXlsxBuffer(
  sheetName: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  for (const r of rows) {
    sheet.addRow(r);
  }
  sheet.columns.forEach((col) => {
    col.width = 18;
  });
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export function xlsxResponse(filename: string, buf: Buffer): Response {
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
