import { NextRequest } from "next/server";
import { can } from "@/lib/auth";
import { listActivityLogs } from "@/lib/activity";
import { toCsv, csvResponse } from "@/lib/export";
import { formatDateTime } from "@/lib/utils";
import type { ActivityLog } from "@/lib/types";

export async function GET(req: NextRequest) {
  const allowed = await can("activity", "export");
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const logs = listActivityLogs(
    {
      module: sp.get("module") ?? undefined,
      userId: sp.get("userId") ?? undefined,
      from: sp.get("from") ?? undefined,
      to: sp.get("to") ?? undefined,
      search: sp.get("search") ?? undefined,
    },
    2000
  ) as unknown as ActivityLog[];

  const headers = ["User", "Action", "Module", "Record", "Previous Value", "New Value", "Date/Time"];
  const rows = logs.map((a) => [a.user_name, a.action, a.module, a.record_label, a.previous_value, a.new_value, formatDateTime(a.created_at)]);
  return csvResponse("activity-log.csv", toCsv(headers, rows));
}
