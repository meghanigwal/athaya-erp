import { getDb, newId, nextCode } from "../db";
import type { Coach } from "../types";

export function listCoaches(includeInactive = true): Coach[] {
  const db = getDb();
  const sql = includeInactive
    ? `SELECT * FROM coaches ORDER BY name ASC`
    : `SELECT * FROM coaches WHERE employment_status = 'ACTIVE' ORDER BY name ASC`;
  return db.prepare(sql).all() as unknown as Coach[];
}

export function getCoach(id: string): Coach | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM coaches WHERE id = ?`).get(id) as Coach | undefined;
}

export interface CoachInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  qualification?: string | null;
  experience?: string | null;
  joining_date?: string | null;
  centre_id?: string | null;
  salary_info?: string | null;
  notes?: string | null;
}

export function createCoach(input: CoachInput): Coach {
  const db = getDb();
  const id = newId();
  const code = nextCode("C");
  db.prepare(
    `INSERT INTO coaches (id, code, name, phone, email, role, qualification, experience, joining_date, centre_id, salary_info, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    code,
    input.name,
    input.phone ?? null,
    input.email ?? null,
    input.role ?? null,
    input.qualification ?? null,
    input.experience ?? null,
    input.joining_date ?? null,
    input.centre_id ?? null,
    input.salary_info ?? null,
    input.notes ?? null
  );
  return getCoach(id)!;
}

export function updateCoach(id: string, input: Partial<CoachInput & { employment_status: string }>): Coach {
  const db = getDb();
  const current = getCoach(id);
  if (!current) throw new Error("Coach not found");
  const merged = { ...current, ...input };
  db.prepare(
    `UPDATE coaches SET name=?, phone=?, email=?, role=?, qualification=?, experience=?, joining_date=?, centre_id=?, salary_info=?, notes=?, employment_status=?, updated_at=datetime('now')
     WHERE id = ?`
  ).run(
    merged.name,
    merged.phone,
    merged.email,
    merged.role,
    merged.qualification,
    merged.experience,
    merged.joining_date,
    merged.centre_id,
    merged.salary_info,
    merged.notes,
    merged.employment_status,
    id
  );
  return getCoach(id)!;
}

export function deleteCoach(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM coaches WHERE id = ?`).run(id);
}

export function coachStats(id: string) {
  const db = getDb();
  const players = db
    .prepare(`SELECT COUNT(*) as n FROM players WHERE coach_id = ? AND status = 'ACTIVE'`)
    .get(id) as { n: number };
  const batches = db.prepare(`SELECT COUNT(*) as n FROM batches WHERE coach_id = ?`).get(id) as {
    n: number;
  };
  return { activePlayers: players.n, batches: batches.n };
}

export function coachSummary() {
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) as n FROM coaches`).get() as { n: number };
  const active = db.prepare(`SELECT COUNT(*) as n FROM coaches WHERE employment_status='ACTIVE'`).get() as {
    n: number;
  };
  return { total: total.n, active: active.n };
}
