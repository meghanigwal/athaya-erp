import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getDb } from "@/lib/db";

/**
 * Free alternative to Railway's paid automatic-backup feature.
 *
 * Returns a consistent snapshot of the live SQLite database as a downloadable
 * file. Lives under /api/public/ so the app's session-cookie middleware (see
 * src/proxy.ts) doesn't redirect it to /login — this is protected instead by
 * a shared secret (BACKUP_SECRET, set as a Railway environment variable),
 * since this endpoint is meant to be called by an unattended scheduled job,
 * not a browser with a login session.
 *
 * Usage: GET /api/public/backup?key=<BACKUP_SECRET>
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
    return new NextResponse("Backups are not configured on this deployment.", { status: 501 });
  }
  if (!key || !safeEqual(key, expected)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const db = getDb();
  const snapshotPath = path.join(os.tmpdir(), `athaya-backup-${Date.now()}-${crypto.randomUUID()}.db`);

  try {
    // VACUUM INTO produces a single, consistent, compacted snapshot file,
    // safe to run against a live database (including one in WAL mode).
    db.exec(`VACUUM INTO '${snapshotPath.replace(/'/g, "''")}';`);
    const buf = fs.readFileSync(snapshotPath);
    const filename = `athaya-backup-${new Date().toISOString().slice(0, 10)}.db`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
  }
}
