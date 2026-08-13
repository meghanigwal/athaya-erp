import { getDb, newId, type SqlParam } from "./db";
import type { User } from "./types";

export interface LogParams {
  user: User | null;
  action: string; // e.g. "Created", "Updated", "Deleted", "Payment Recorded", "Status Changed"
  module: string; // e.g. "Players", "Leads", "Finance"
  recordId?: string | null;
  recordLabel?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  description?: string | null;
}

export function logActivity(params: LogParams) {
  const db = getDb();
  db.prepare(
    `INSERT INTO activity_logs (id, user_id, user_name, action, module, record_id, record_label, previous_value, new_value, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId(),
    params.user?.id ?? null,
    params.user?.name ?? "System",
    params.action,
    params.module,
    params.recordId ?? null,
    params.recordLabel ?? null,
    params.previousValue ?? null,
    params.newValue ?? null,
    params.description ?? null
  );
}

export interface ActivityFilters {
  module?: string;
  userId?: string;
  search?: string;
  from?: string;
  to?: string;
}

export function listActivityLogs(filters: ActivityFilters = {}, limit = 200) {
  const db = getDb();
  const clauses: string[] = ["1=1"];
  const params: SqlParam[] = [];
  if (filters.module) {
    clauses.push("module = ?");
    params.push(filters.module);
  }
  if (filters.userId) {
    clauses.push("user_id = ?");
    params.push(filters.userId);
  }
  if (filters.from) {
    clauses.push("date(created_at) >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("date(created_at) <= ?");
    params.push(filters.to);
  }
  if (filters.search) {
    clauses.push("(record_label LIKE ? OR description LIKE ? OR user_name LIKE ? OR action LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like, like);
  }
  const sql = `SELECT * FROM activity_logs WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);
  return db.prepare(sql).all(...params);
}

/** Compare two plain objects field by field and return a human readable diff description, or null if unchanged. */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  labels: Record<string, string> = {}
): { description: string; previous: string; next: string } | null {
  const changes: string[] = [];
  const prevParts: string[] = [];
  const nextParts: string[] = [];
  for (const key of Object.keys(after)) {
    if (!(key in before)) continue;
    const b = before[key];
    const a = after[key];
    if (String(b ?? "") !== String(a ?? "")) {
      const label = labels[key] ?? key;
      changes.push(`${label} changed from "${b ?? "-"}" to "${a ?? "-"}"`);
      prevParts.push(`${label}: ${b ?? "-"}`);
      nextParts.push(`${label}: ${a ?? "-"}`);
    }
  }
  if (changes.length === 0) return null;
  return {
    description: changes.join("; "),
    previous: prevParts.join(", "),
    next: nextParts.join(", "),
  };
}
