import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";

/**
 * Temporary read-only diagnostic endpoint used to investigate a data-loss
 * report. Protected by the same shared secret as the backup endpoint.
 * Safe to remove once the investigation is complete.
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

  const nonSampleLeads = (db.prepare(`SELECT COUNT(*) as n FROM leads`).get() as { n: number }).n;
  const sampleFlaggedPlayers = (db.prepare(`SELECT COUNT(*) as n FROM players WHERE is_sample = 1`).get() as { n: number }).n;
  const nonSamplePlayers = (db.prepare(`SELECT COUNT(*) as n FROM players WHERE is_sample = 0`).get() as { n: number }).n;

  const recentActivity = db
    .prepare(
      `SELECT id, user_name, action, module, record_label, description, created_at
       FROM activity_logs ORDER BY created_at DESC LIMIT 40`
    )
    .all();

  const recentDeletions = db
    .prepare(
      `SELECT id, user_name, action, module, record_label, description, created_at
       FROM activity_logs WHERE action = 'Deleted' ORDER BY created_at DESC LIMIT 40`
    )
    .all();

  const users = db.prepare(`SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at ASC`).all();

  const dbFileInfo = (() => {
    try {
      const fs = require("node:fs");
      const path = require("node:path");
      const p = path.join(process.cwd(), "data", "athaya.db");
      const stat = fs.statSync(p);
      return { path: p, sizeBytes: stat.size, mtime: stat.mtime };
    } catch (e) {
      return { error: String(e) };
    }
  })();

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    counts,
    sampleFlaggedPlayers,
    nonSamplePlayers,
    nonSampleLeads,
    users,
    recentActivity,
    recentDeletions,
    dbFileInfo,
    env: {
      SEED_ACCOUNTS_ONLY: process.env.SEED_ACCOUNTS_ONLY ?? null,
      RAILWAY_VOLUME_MOUNT_PATH: process.env.RAILWAY_VOLUME_MOUNT_PATH ?? null,
    },
  });
}
