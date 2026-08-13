import { NextRequest } from "next/server";
import { can } from "@/lib/auth";
import { runReport, type ReportKey } from "@/lib/modules/reports";
import { toCsv, toXlsxBuffer, csvResponse, xlsxResponse } from "@/lib/export";

export async function GET(req: NextRequest, context: { params: Promise<{ key: string }> }) {
  const allowed = await can("reports", "export");
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const { key } = await context.params;
  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") ?? "csv";

  const result = runReport(key as ReportKey, {
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    centreId: sp.get("centreId") ?? undefined,
    coachId: sp.get("coachId") ?? undefined,
    status: sp.get("status") ?? undefined,
    search: sp.get("search") ?? undefined,
  });

  const stringRows: (string | number)[][] = result.rows.map((r) =>
    r.map((v) => (v === null || v === undefined ? "" : (v as string | number)))
  );

  if (format === "xlsx") {
    const buf = await toXlsxBuffer(key, result.headers, stringRows);
    return xlsxResponse(`${key}-report.xlsx`, buf);
  }
  return csvResponse(`${key}-report.csv`, toCsv(result.headers, stringRows));
}
