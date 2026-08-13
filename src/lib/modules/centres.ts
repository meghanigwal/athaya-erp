import { getDb, newId, nextCode } from "../db";
import type { Batch, Centre } from "../types";

export function listCentres(includeInactive = true): Centre[] {
  const db = getDb();
  const sql = includeInactive
    ? `SELECT * FROM centres ORDER BY name ASC`
    : `SELECT * FROM centres WHERE status = 'ACTIVE' ORDER BY name ASC`;
  return db.prepare(sql).all() as unknown as Centre[];
}

export function getCentre(id: string): Centre | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM centres WHERE id = ?`).get(id) as Centre | undefined;
}

export function createCentre(input: {
  name: string;
  address?: string | null;
  city?: string | null;
}): Centre {
  const db = getDb();
  const id = newId();
  const code = nextCode("CTR");
  db.prepare(
    `INSERT INTO centres (id, code, name, address, city) VALUES (?, ?, ?, ?, ?)`
  ).run(id, code, input.name, input.address ?? null, input.city ?? null);
  return getCentre(id)!;
}

export function updateCentre(
  id: string,
  input: Partial<{ name: string; address: string | null; city: string | null; status: string }>
): Centre {
  const db = getDb();
  const current = getCentre(id);
  if (!current) throw new Error("Centre not found");
  const merged = { ...current, ...input };
  db.prepare(
    `UPDATE centres SET name = ?, address = ?, city = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(merged.name, merged.address, merged.city, merged.status, id);
  return getCentre(id)!;
}

export function listBatches(centreId?: string): Batch[] {
  const db = getDb();
  if (centreId) {
    return db.prepare(`SELECT * FROM batches WHERE centre_id = ? ORDER BY name ASC`).all(centreId) as unknown as Batch[];
  }
  return db.prepare(`SELECT * FROM batches ORDER BY name ASC`).all() as unknown as Batch[];
}

export function getBatch(id: string): Batch | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM batches WHERE id = ?`).get(id) as Batch | undefined;
}

export function createBatch(input: {
  name: string;
  centre_id?: string | null;
  coach_id?: string | null;
  schedule?: string | null;
  age_group?: string | null;
}): Batch {
  const db = getDb();
  const id = newId();
  const code = nextCode("BAT");
  db.prepare(
    `INSERT INTO batches (id, code, name, centre_id, coach_id, schedule, age_group) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, code, input.name, input.centre_id ?? null, input.coach_id ?? null, input.schedule ?? null, input.age_group ?? null);
  return getBatch(id)!;
}

export function updateBatch(
  id: string,
  input: Partial<{
    name: string;
    centre_id: string | null;
    coach_id: string | null;
    schedule: string | null;
    age_group: string | null;
    status: string;
  }>
): Batch {
  const db = getDb();
  const current = getBatch(id);
  if (!current) throw new Error("Batch not found");
  const merged = { ...current, ...input };
  db.prepare(
    `UPDATE batches SET name = ?, centre_id = ?, coach_id = ?, schedule = ?, age_group = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(merged.name, merged.centre_id, merged.coach_id, merged.schedule, merged.age_group, merged.status, id);
  return getBatch(id)!;
}

export function deleteCentre(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM centres WHERE id = ?`).run(id);
}

export function deleteBatch(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM batches WHERE id = ?`).run(id);
}

export function centreStats() {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.id, c.name,
        (SELECT COUNT(*) FROM players p WHERE p.centre_id = c.id AND p.status = 'ACTIVE') as active_players,
        (SELECT COUNT(*) FROM batches b WHERE b.centre_id = c.id) as batch_count,
        (SELECT COUNT(DISTINCT coach_id) FROM players p WHERE p.centre_id = c.id AND p.coach_id IS NOT NULL) as coach_count
       FROM centres c ORDER BY c.name ASC`
    )
    .all();
}
