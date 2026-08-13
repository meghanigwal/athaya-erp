import { getDb, newId, nextCode, type SqlParam } from "../db";
import type { Payment, PaymentMethod, PaymentStatus, Player, PlayerStatus } from "../types";

export interface PlayerFilters {
  status?: string;
  centreId?: string;
  batchId?: string;
  coachId?: string;
  paymentStatus?: string;
  search?: string;
}

export interface PlayerRow extends Player {
  centre_name: string | null;
  batch_name: string | null;
  coach_name: string | null;
}

export function listPlayers(filters: PlayerFilters = {}): PlayerRow[] {
  const db = getDb();
  const clauses: string[] = ["1=1"];
  const params: SqlParam[] = [];
  if (filters.status) {
    clauses.push("p.status = ?");
    params.push(filters.status);
  }
  if (filters.centreId) {
    clauses.push("p.centre_id = ?");
    params.push(filters.centreId);
  }
  if (filters.batchId) {
    clauses.push("p.batch_id = ?");
    params.push(filters.batchId);
  }
  if (filters.coachId) {
    clauses.push("p.coach_id = ?");
    params.push(filters.coachId);
  }
  if (filters.paymentStatus) {
    clauses.push("p.payment_status = ?");
    params.push(filters.paymentStatus);
  }
  if (filters.search) {
    clauses.push("(p.name LIKE ? OR p.parent_name LIKE ? OR p.phone LIKE ? OR p.code LIKE ? OR p.society LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like, like, like);
  }
  const sql = `
    SELECT p.*, c.name as centre_name, b.name as batch_name, co.name as coach_name
    FROM players p
    LEFT JOIN centres c ON c.id = p.centre_id
    LEFT JOIN batches b ON b.id = p.batch_id
    LEFT JOIN coaches co ON co.id = p.coach_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY p.created_at DESC
  `;
  return db.prepare(sql).all(...params) as unknown as PlayerRow[];
}

export function getPlayer(id: string): PlayerRow | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, c.name as centre_name, b.name as batch_name, co.name as coach_name
       FROM players p
       LEFT JOIN centres c ON c.id = p.centre_id
       LEFT JOIN batches b ON b.id = p.batch_id
       LEFT JOIN coaches co ON co.id = p.coach_id
       WHERE p.id = ?`
    )
    .get(id) as PlayerRow | undefined;
}

export interface PlayerInput {
  name: string;
  dob?: string | null;
  gender?: string | null;
  parent_name?: string | null;
  father_mother_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  society?: string | null;
  city?: string | null;
  centre_id?: string | null;
  batch_id?: string | null;
  age_group?: string | null;
  coach_id?: string | null;
  joining_date?: string | null;
  registration_date?: string | null;
  programme?: string | null;
  monthly_fee?: number;
  registration_fee?: number;
  status?: PlayerStatus;
  emergency_contact?: string | null;
  notes?: string | null;
  lead_id?: string | null;
  is_sample?: number;
}

export function createPlayer(input: PlayerInput): Player {
  const db = getDb();
  const id = newId();
  const code = nextCode("P");
  db.prepare(
    `INSERT INTO players (id, code, name, dob, gender, parent_name, father_mother_name, phone, whatsapp, email, address, society, city, centre_id, batch_id, age_group, coach_id, joining_date, registration_date, programme, monthly_fee, registration_fee, payment_status, status, emergency_contact, notes, lead_id, is_sample)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)`
  ).run(
    id,
    code,
    input.name,
    input.dob ?? null,
    input.gender ?? null,
    input.parent_name ?? null,
    input.father_mother_name ?? null,
    input.phone ?? null,
    input.whatsapp ?? null,
    input.email ?? null,
    input.address ?? null,
    input.society ?? null,
    input.city ?? null,
    input.centre_id ?? null,
    input.batch_id ?? null,
    input.age_group ?? null,
    input.coach_id ?? null,
    input.joining_date ?? null,
    input.registration_date ?? null,
    input.programme ?? null,
    input.monthly_fee ?? 0,
    input.registration_fee ?? 0,
    input.status ?? "ACTIVE",
    input.emergency_contact ?? null,
    input.notes ?? null,
    input.lead_id ?? null,
    input.is_sample ?? 0
  );
  return getPlayer(id)!;
}

export function updatePlayer(id: string, input: Partial<PlayerInput>): Player {
  const db = getDb();
  const current = getPlayer(id);
  if (!current) throw new Error("Player not found");
  const merged = { ...current, ...input };
  db.prepare(
    `UPDATE players SET name=?, dob=?, gender=?, parent_name=?, father_mother_name=?, phone=?, whatsapp=?, email=?, address=?, society=?, city=?, centre_id=?, batch_id=?, age_group=?, coach_id=?, joining_date=?, registration_date=?, programme=?, monthly_fee=?, registration_fee=?, status=?, emergency_contact=?, notes=?, updated_at=datetime('now')
     WHERE id=?`
  ).run(
    merged.name,
    merged.dob,
    merged.gender,
    merged.parent_name,
    merged.father_mother_name,
    merged.phone,
    merged.whatsapp,
    merged.email,
    merged.address,
    merged.society,
    merged.city,
    merged.centre_id,
    merged.batch_id,
    merged.age_group,
    merged.coach_id,
    merged.joining_date,
    merged.registration_date,
    merged.programme,
    merged.monthly_fee,
    merged.registration_fee,
    merged.status,
    merged.emergency_contact,
    merged.notes,
    id
  );
  return getPlayer(id)!;
}

// ---------- Payments / Fee tracking ----------

export function listPaymentsForPlayer(playerId: string): Payment[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM payments WHERE player_id = ? ORDER BY created_at DESC`)
    .all(playerId) as unknown as Payment[];
}

export function totalPaidForPlayer(playerId: string): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE player_id = ? AND status IN ('PAID','PARTIALLY_PAID')`)
    .get(playerId) as { total: number };
  return row.total;
}

export interface RecordPaymentInput {
  player_id: string;
  amount: number;
  for_month?: string | null;
  due_date?: string | null;
  payment_date?: string | null;
  payment_method?: PaymentMethod;
  status?: PaymentStatus;
  notes?: string | null;
  added_by_user_id?: string | null;
}

/** Records a payment for a player, and recalculates + updates the player's payment_status. */
export function recordPayment(input: RecordPaymentInput): Payment {
  const db = getDb();
  const id = newId();
  const code = nextCode("PAY");
  db.prepare(
    `INSERT INTO payments (id, code, player_id, amount, for_month, due_date, payment_date, payment_method, status, notes, added_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    code,
    input.player_id,
    input.amount,
    input.for_month ?? null,
    input.due_date ?? null,
    input.payment_date ?? null,
    input.payment_method ?? "CASH",
    input.status ?? "PAID",
    input.notes ?? null,
    input.added_by_user_id ?? null
  );

  recalculatePlayerPaymentStatus(input.player_id);

  return db.prepare(`SELECT * FROM payments WHERE id = ?`).get(id) as unknown as Payment;
}

export function recalculatePlayerPaymentStatus(playerId: string) {
  const db = getDb();
  const player = getPlayer(playerId);
  if (!player) return;
  const paid = totalPaidForPlayer(playerId);
  let status: PaymentStatus;
  if (paid <= 0) {
    status = isOverdue(player) ? "OVERDUE" : "PENDING";
  } else if (paid < player.monthly_fee) {
    status = "PARTIALLY_PAID";
  } else {
    status = "PAID";
  }
  db.prepare(`UPDATE players SET payment_status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, playerId);
}

function isOverdue(player: Player): boolean {
  if (!player.joining_date) return false;
  const joined = new Date(player.joining_date);
  const now = new Date();
  const daysSince = (now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 35;
}

export function pendingPayments(limit = 20): PlayerRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, c.name as centre_name, b.name as batch_name, co.name as coach_name
       FROM players p
       LEFT JOIN centres c ON c.id = p.centre_id
       LEFT JOIN batches b ON b.id = p.batch_id
       LEFT JOIN coaches co ON co.id = p.coach_id
       WHERE p.status = 'ACTIVE' AND p.payment_status IN ('PENDING','PARTIALLY_PAID','OVERDUE')
       ORDER BY p.updated_at DESC LIMIT ?`
    )
    .all(limit) as unknown as PlayerRow[];
}

export function playerStats() {
  const db = getDb();
  const active = db.prepare(`SELECT COUNT(*) as n FROM players WHERE status = 'ACTIVE'`).get() as { n: number };
  const total = db.prepare(`SELECT COUNT(*) as n FROM players`).get() as { n: number };
  const pendingAmount = db
    .prepare(
      `SELECT COALESCE(SUM(monthly_fee),0) as total FROM players WHERE status='ACTIVE' AND payment_status IN ('PENDING','PARTIALLY_PAID','OVERDUE')`
    )
    .get() as { total: number };
  return { active: active.n, total: total.n, pendingAmount: pendingAmount.total };
}
