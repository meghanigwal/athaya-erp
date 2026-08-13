import { getDb, newId, nextCode, type SqlParam } from "../db";
import type { PaymentMethod, Transaction, TransactionType } from "../types";
import { endOfMonthIso, startOfMonthIso } from "../utils";

export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  centreId?: string;
  paymentMethod?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface TransactionRow extends Transaction {
  centre_name: string | null;
  player_name: string | null;
  added_by_name: string | null;
}

export function listTransactions(filters: TransactionFilters = {}): TransactionRow[] {
  const db = getDb();
  const clauses: string[] = ["1=1"];
  const params: SqlParam[] = [];
  if (filters.type) {
    clauses.push("t.type = ?");
    params.push(filters.type);
  }
  if (filters.category) {
    clauses.push("t.category = ?");
    params.push(filters.category);
  }
  if (filters.centreId) {
    clauses.push("t.related_centre_id = ?");
    params.push(filters.centreId);
  }
  if (filters.paymentMethod) {
    clauses.push("t.payment_method = ?");
    params.push(filters.paymentMethod);
  }
  if (filters.from) {
    clauses.push("t.date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("t.date <= ?");
    params.push(filters.to);
  }
  if (filters.search) {
    clauses.push("(t.description LIKE ? OR t.code LIKE ? OR t.category LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }
  const sql = `
    SELECT t.*, c.name as centre_name, p.name as player_name, u.name as added_by_name
    FROM transactions t
    LEFT JOIN centres c ON c.id = t.related_centre_id
    LEFT JOIN players p ON p.id = t.related_player_id
    LEFT JOIN users u ON u.id = t.added_by_user_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY t.date DESC, t.created_at DESC
  `;
  return db.prepare(sql).all(...params) as unknown as TransactionRow[];
}

export function getTransaction(id: string): Transaction | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id) as Transaction | undefined;
}

export interface TransactionInput {
  date: string;
  type: TransactionType;
  category: string;
  description?: string | null;
  amount: number;
  payment_method?: PaymentMethod;
  related_player_id?: string | null;
  related_centre_id?: string | null;
  added_by_user_id?: string | null;
  notes?: string | null;
}

export function createTransaction(input: TransactionInput): Transaction {
  const db = getDb();
  const id = newId();
  const code = nextCode("TXN");
  db.prepare(
    `INSERT INTO transactions (id, code, date, type, category, description, amount, payment_method, related_player_id, related_centre_id, added_by_user_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    code,
    input.date,
    input.type,
    input.category,
    input.description ?? null,
    input.amount,
    input.payment_method ?? "CASH",
    input.related_player_id ?? null,
    input.related_centre_id ?? null,
    input.added_by_user_id ?? null,
    input.notes ?? null
  );
  return getTransaction(id)!;
}

export function deleteTransaction(id: string) {
  const db = getDb();
  db.prepare(`DELETE FROM transactions WHERE id = ?`).run(id);
}

export function financialSummary(from?: string, to?: string) {
  const db = getDb();
  const f = from ?? startOfMonthIso();
  const t = to ?? endOfMonthIso();
  const revenue = db
    .prepare(`SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='REVENUE' AND date BETWEEN ? AND ?`)
    .get(f, t) as { total: number };
  const expense = db
    .prepare(`SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='EXPENSE' AND date BETWEEN ? AND ?`)
    .get(f, t) as { total: number };
  const totalRevenueAllTime = db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='REVENUE'`).get() as {
    total: number;
  };
  const totalExpenseAllTime = db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='EXPENSE'`).get() as {
    total: number;
  };
  return {
    revenue: revenue.total,
    expense: expense.total,
    profit: revenue.total - expense.total,
    totalRevenueAllTime: totalRevenueAllTime.total,
    totalExpenseAllTime: totalExpenseAllTime.total,
    profitAllTime: totalRevenueAllTime.total - totalExpenseAllTime.total,
  };
}

export function revenueByMonth(months = 6) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', date) as month,
          SUM(CASE WHEN type='REVENUE' THEN amount ELSE 0 END) as revenue,
          SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) as expense
       FROM transactions
       WHERE date >= date('now', ?)
       GROUP BY month ORDER BY month ASC`
    )
    .all(`-${months} months`) as { month: string; revenue: number; expense: number }[];
  return rows;
}
