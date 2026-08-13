import { NextRequest } from "next/server";
import { can } from "@/lib/auth";
import { listTransactions } from "@/lib/modules/finance";
import { toCsv, csvResponse } from "@/lib/export";
import { formatDate } from "@/lib/utils";
import type { TransactionType } from "@/lib/types";

export async function GET(req: NextRequest) {
  const allowed = await can("finance", "export");
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const transactions = listTransactions({
    type: (sp.get("type") as TransactionType | null) ?? undefined,
    category: sp.get("category") ?? undefined,
    centreId: sp.get("centreId") ?? undefined,
    paymentMethod: sp.get("paymentMethod") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
  });

  const headers = ["Transaction ID", "Date", "Type", "Category", "Description", "Amount", "Payment Method", "Centre", "Added By"];
  const rows = transactions.map((t) => [t.code, formatDate(t.date), t.type, t.category, t.description, t.amount, t.payment_method, t.centre_name, t.added_by_name]);
  return csvResponse("finance-export.csv", toCsv(headers, rows));
}
