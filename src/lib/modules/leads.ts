import { getDb, newId, nextCode, type SqlParam } from "../db";
import type { Lead, LeadStatus } from "../types";

export interface LeadFilters {
  status?: string;
  centreId?: string;
  assignedUserId?: string;
  search?: string;
  from?: string;
  to?: string;
}

export interface LeadRow extends Lead {
  centre_name: string | null;
  assigned_user_name: string | null;
}

export function listLeads(filters: LeadFilters = {}): LeadRow[] {
  const db = getDb();
  const clauses: string[] = ["1=1"];
  const params: SqlParam[] = [];
  if (filters.status) {
    clauses.push("l.status = ?");
    params.push(filters.status);
  }
  if (filters.centreId) {
    clauses.push("l.centre_id = ?");
    params.push(filters.centreId);
  }
  if (filters.assignedUserId) {
    clauses.push("l.assigned_user_id = ?");
    params.push(filters.assignedUserId);
  }
  if (filters.from) {
    clauses.push("l.lead_date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("l.lead_date <= ?");
    params.push(filters.to);
  }
  if (filters.search) {
    clauses.push(
      "(l.child_name LIKE ? OR l.parent_name LIKE ? OR l.phone LIKE ? OR l.code LIKE ? OR l.location LIKE ?)"
    );
    const like = `%${filters.search}%`;
    params.push(like, like, like, like, like);
  }
  const sql = `
    SELECT l.*, c.name as centre_name, u.name as assigned_user_name
    FROM leads l
    LEFT JOIN centres c ON c.id = l.centre_id
    LEFT JOIN users u ON u.id = l.assigned_user_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY l.created_at DESC
  `;
  return db.prepare(sql).all(...params) as unknown as LeadRow[];
}

export function getLead(id: string): LeadRow | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT l.*, c.name as centre_name, u.name as assigned_user_name
       FROM leads l
       LEFT JOIN centres c ON c.id = l.centre_id
       LEFT JOIN users u ON u.id = l.assigned_user_id
       WHERE l.id = ?`
    )
    .get(id) as LeadRow | undefined;
}

export interface LeadInput {
  parent_name?: string | null;
  child_name: string;
  child_age?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  location?: string | null;
  city?: string | null;
  source?: string | null;
  programme?: string | null;
  centre_id?: string | null;
  lead_date?: string | null;
  assigned_user_id?: string | null;
  status?: LeadStatus;
  follow_up_date?: string | null;
  notes?: string | null;
  expected_fee?: number | null;
}

export function createLead(input: LeadInput): Lead {
  const db = getDb();
  const id = newId();
  const code = nextCode("L");
  db.prepare(
    `INSERT INTO leads (id, code, parent_name, child_name, child_age, phone, whatsapp, email, location, city, source, programme, centre_id, lead_date, assigned_user_id, status, follow_up_date, notes, expected_fee)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    code,
    input.parent_name ?? null,
    input.child_name,
    input.child_age ?? null,
    input.phone ?? null,
    input.whatsapp ?? null,
    input.email ?? null,
    input.location ?? null,
    input.city ?? null,
    input.source ?? null,
    input.programme ?? null,
    input.centre_id ?? null,
    input.lead_date ?? null,
    input.assigned_user_id ?? null,
    input.status ?? "NEW",
    input.follow_up_date ?? null,
    input.notes ?? null,
    input.expected_fee ?? null
  );
  return getLead(id)!;
}

export function updateLead(id: string, input: Partial<LeadInput>): Lead {
  const db = getDb();
  const current = getLead(id);
  if (!current) throw new Error("Lead not found");
  const merged = { ...current, ...input };
  const conversion_status =
    merged.status === "CONVERTED" ? "CONVERTED" : merged.status === "LOST" || merged.status === "NOT_INTERESTED" ? "LOST" : "OPEN";
  db.prepare(
    `UPDATE leads SET parent_name=?, child_name=?, child_age=?, phone=?, whatsapp=?, email=?, location=?, city=?, source=?, programme=?, centre_id=?, lead_date=?, assigned_user_id=?, status=?, follow_up_date=?, notes=?, expected_fee=?, conversion_status=?, updated_at=datetime('now')
     WHERE id=?`
  ).run(
    merged.parent_name,
    merged.child_name,
    merged.child_age,
    merged.phone,
    merged.whatsapp,
    merged.email,
    merged.location,
    merged.city,
    merged.source,
    merged.programme,
    merged.centre_id,
    merged.lead_date,
    merged.assigned_user_id,
    merged.status,
    merged.follow_up_date,
    merged.notes,
    merged.expected_fee,
    conversion_status,
    id
  );
  return getLead(id)!;
}

export function deleteLead(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM leads WHERE id = ?`).run(id);
}

export function leadStats() {
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) as n FROM leads`).get() as { n: number };
  const converted = db.prepare(`SELECT COUNT(*) as n FROM leads WHERE status='CONVERTED'`).get() as {
    n: number;
  };
  const lost = db.prepare(`SELECT COUNT(*) as n FROM leads WHERE status IN ('LOST','NOT_INTERESTED')`).get() as {
    n: number;
  };
  const pendingFollowUp = db
    .prepare(
      `SELECT COUNT(*) as n FROM leads WHERE conversion_status='OPEN' AND follow_up_date IS NOT NULL AND follow_up_date <= date('now')`
    )
    .get() as { n: number };
  const bySource = db
    .prepare(`SELECT COALESCE(source,'Unknown') as source, COUNT(*) as n FROM leads GROUP BY source ORDER BY n DESC`)
    .all();
  const byEmployee = db
    .prepare(
      `SELECT COALESCE(u.name, 'Unassigned') as name, COUNT(*) as n FROM leads l LEFT JOIN users u ON u.id = l.assigned_user_id GROUP BY u.name ORDER BY n DESC`
    )
    .all();
  const byLocation = db
    .prepare(`SELECT COALESCE(location,'Unknown') as location, COUNT(*) as n FROM leads GROUP BY location ORDER BY n DESC LIMIT 10`)
    .all();
  const conversionRate = total.n > 0 ? Math.round((converted.n / total.n) * 1000) / 10 : 0;
  return { total: total.n, converted: converted.n, lost: lost.n, pendingFollowUp: pendingFollowUp.n, bySource, byEmployee, byLocation, conversionRate };
}

export function overdueFollowUps(limit = 10): LeadRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT l.*, c.name as centre_name, u.name as assigned_user_name
       FROM leads l
       LEFT JOIN centres c ON c.id = l.centre_id
       LEFT JOIN users u ON u.id = l.assigned_user_id
       WHERE l.conversion_status = 'OPEN' AND l.follow_up_date IS NOT NULL AND l.follow_up_date <= date('now')
       ORDER BY l.follow_up_date ASC LIMIT ?`
    )
    .all(limit) as unknown as LeadRow[];
}
