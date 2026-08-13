import { NextRequest } from "next/server";
import { can } from "@/lib/auth";
import { listPlayers } from "@/lib/modules/players";
import { toCsv, csvResponse } from "@/lib/export";
import { formatDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const allowed = await can("players", "export");
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const players = listPlayers({
    status: sp.get("status") ?? undefined,
    centreId: sp.get("centreId") ?? undefined,
    paymentStatus: sp.get("paymentStatus") ?? undefined,
    search: sp.get("search") ?? undefined,
  });

  const headers = ["Player ID", "Name", "Parent", "Phone", "Centre", "Batch", "Coach", "Programme", "Monthly Fee", "Payment Status", "Status", "Joining Date"];
  const rows = players.map((p) => [p.code, p.name, p.parent_name, p.phone, p.centre_name, p.batch_name, p.coach_name, p.programme, p.monthly_fee, p.payment_status, p.status, formatDate(p.joining_date)]);
  return csvResponse("players-export.csv", toCsv(headers, rows));
}
