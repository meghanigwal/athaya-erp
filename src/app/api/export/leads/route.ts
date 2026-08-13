import { NextRequest } from "next/server";
import { can } from "@/lib/auth";
import { listLeads } from "@/lib/modules/leads";
import { toCsv, csvResponse } from "@/lib/export";
import { formatDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const allowed = await can("leads", "export");
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const leads = listLeads({
    status: sp.get("status") ?? undefined,
    centreId: sp.get("centreId") ?? undefined,
    assignedUserId: sp.get("assignedUserId") ?? undefined,
    search: sp.get("search") ?? undefined,
  });

  const headers = ["Lead ID", "Child Name", "Parent", "Phone", "Centre", "Source", "Status", "Assigned To", "Lead Date", "Follow-up Date", "Expected Fee"];
  const rows = leads.map((l) => [l.code, l.child_name, l.parent_name, l.phone, l.centre_name, l.source, l.status, l.assigned_user_name, formatDate(l.lead_date), formatDate(l.follow_up_date), l.expected_fee]);
  return csvResponse("leads-export.csv", toCsv(headers, rows));
}
