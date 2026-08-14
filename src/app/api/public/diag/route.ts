import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";

/**
 * Temporary read-only diagnostic endpoint used to verify data integrity
 * during live testing. Protected by the same shared secret as the backup
 * endpoint. Safe to remove once testing is complete.
 *
 * Usage: GET /api/public/diag?key=<BACKUP_SECRET>
 */

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET(req: NextRequest) {
  const expected = process.env.BACKUP_SECRET;
  const key = req.nextUrl.searchParams.get("key");

  if (!expected) {
    return new NextResponse("Not configured.", { status: 501 });
  }
  if (!key || !safeEqual(key, expected)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const db = getDb();

  const tables = [
    "users",
    "leads",
    "players",
    "coaches",
    "centres",
    "batches",
    "payments",
    "transactions",
    "activity_logs",
    "import_history",
  ];

  const counts: Record<string, number> = {};
  for (const t of tables) {
    const row = db.prepare(`SELECT COUNT(*) as n FROM ${t}`).get() as { n: number };
    counts[t] = row.n;
  }

  const recentActivity = db
    .prepare(
      `SELECT id, user_name, action, module, record_label, description, created_at
       FROM activity_logs ORDER BY created_at DESC LIMIT 15`
    )
    .all();

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    counts,
    recentActivity,
  });
}
