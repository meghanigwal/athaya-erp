import { getDb, type SqlParam } from "../db";

export const REPORT_TYPES = [
  { key: "players", label: "Player Report" },
  { key: "leads", label: "Lead Report" },
  { key: "conversion", label: "Lead Conversion Report" },
  { key: "revenue", label: "Revenue Report" },
  { key: "expense", label: "Expense Report" },
  { key: "pending_payments", label: "Pending Payment Report" },
  { key: "coaches", label: "Coach Report" },
  { key: "centres", label: "Centre Report" },
  { key: "monthly_profit", label: "Monthly Profit Report" },
] as const;

export type ReportKey = (typeof REPORT_TYPES)[number]["key"];

export interface ReportFilters {
  from?: string;
  to?: string;
  centreId?: string;
  coachId?: string;
  status?: string;
  search?: string;
}

export function runReport(key: ReportKey, filters: ReportFilters) {
  switch (key) {
    case "players":
      return playerReport(filters);
    case "leads":
      return leadReport(filters);
    case "conversion":
      return conversionReport(filters);
    case "revenue":
      return revenueReport(filters);
    case "expense":
      return expenseReport(filters);
    case "pending_payments":
      return pendingPaymentReport(filters);
    case "coaches":
      return coachReport(filters);
    case "centres":
      return centreReport(filters);
    case "monthly_profit":
      return monthlyProfitReport(filters);
    default:
      return { headers: [], rows: [] };
  }
}

function buildWhere(clauses: string[], _params: SqlParam[]) {
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

function playerReport(f: ReportFilters) {
  const db = getDb();
  const clauses: string[] = [];
  const params: SqlParam[] = [];
  if (f.from) {
    clauses.push("p.joining_date >= ?");
    params.push(f.from);
  }
  if (f.to) {
    clauses.push("p.joining_date <= ?");
    params.push(f.to);
  }
  if (f.centreId) {
    clauses.push("p.centre_id = ?");
    params.push(f.centreId);
  }
  if (f.coachId) {
    clauses.push("p.coach_id = ?");
    params.push(f.coachId);
  }
  if (f.status) {
    clauses.push("p.status = ?");
    params.push(f.status);
  }
  if (f.search) {
    clauses.push("(p.name LIKE ? OR p.phone LIKE ?)");
    params.push(`%${f.search}%`, `%${f.search}%`);
  }
  const sql = `SELECT p.code, p.name, p.parent_name, p.phone, c.name as centre, co.name as coach, p.programme, p.monthly_fee, p.payment_status, p.status, p.joining_date
    FROM players p LEFT JOIN centres c ON c.id=p.centre_id LEFT JOIN coaches co ON co.id=p.coach_id
    ${buildWhere(clauses, params)} ORDER BY p.created_at DESC`;
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return {
    headers: ["Player ID", "Name", "Parent", "Phone", "Centre", "Coach", "Programme", "Monthly Fee", "Payment Status", "Status", "Joining Date"],
    rows: rows.map((r) => [r.code, r.name, r.parent_name, r.phone, r.centre, r.coach, r.programme, r.monthly_fee, r.payment_status, r.status, r.joining_date]),
  };
}

function leadReport(f: ReportFilters) {
  const db = getDb();
  const clauses: string[] = [];
  const params: SqlParam[] = [];
  if (f.from) {
    clauses.push("l.lead_date >= ?");
    params.push(f.from);
  }
  if (f.to) {
    clauses.push("l.lead_date <= ?");
    params.push(f.to);
  }
  if (f.centreId) {
    clauses.push("l.centre_id = ?");
    params.push(f.centreId);
  }
  if (f.status) {
    clauses.push("l.status = ?");
    params.push(f.status);
  }
  if (f.search) {
    clauses.push("(l.child_name LIKE ? OR l.phone LIKE ?)");
    params.push(`%${f.search}%`, `%${f.search}%`);
  }
  const sql = `SELECT l.code, l.child_name, l.parent_name, l.phone, c.name as centre, l.source, l.status, u.name as assigned, l.lead_date, l.follow_up_date
    FROM leads l LEFT JOIN centres c ON c.id=l.centre_id LEFT JOIN users u ON u.id=l.assigned_user_id
    ${buildWhere(clauses, params)} ORDER BY l.created_at DESC`;
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return {
    headers: ["Lead ID", "Child Name", "Parent", "Phone", "Centre", "Source", "Status", "Assigned To", "Lead Date", "Follow-up Date"],
    rows: rows.map((r) => [r.code, r.child_name, r.parent_name, r.phone, r.centre, r.source, r.status, r.assigned, r.lead_date, r.follow_up_date]),
  };
}

function conversionReport(f: ReportFilters) {
  const db = getDb();
  const clauses: string[] = [];
  const params: SqlParam[] = [];
  if (f.from) {
    clauses.push("lead_date >= ?");
    params.push(f.from);
  }
  if (f.to) {
    clauses.push("lead_date <= ?");
    params.push(f.to);
  }
  const sql = `SELECT COALESCE(source,'Unknown') as source, COUNT(*) as total, SUM(CASE WHEN status='CONVERTED' THEN 1 ELSE 0 END) as converted
    FROM leads ${buildWhere(clauses, params)} GROUP BY source ORDER BY total DESC`;
  const rows = db.prepare(sql).all(...params) as { source: string; total: number; converted: number }[];
  return {
    headers: ["Source", "Total Leads", "Converted", "Conversion Rate"],
    rows: rows.map((r) => [r.source, r.total, r.converted, `${r.total > 0 ? Math.round((r.converted / r.total) * 1000) / 10 : 0}%`]),
  };
}

function revenueReport(f: ReportFilters) {
  const db = getDb();
  const clauses: string[] = ["type='REVENUE'"];
  const params: SqlParam[] = [];
  if (f.from) {
    clauses.push("date >= ?");
    params.push(f.from);
  }
  if (f.to) {
    clauses.push("date <= ?");
    params.push(f.to);
  }
  if (f.centreId) {
    clauses.push("related_centre_id = ?");
    params.push(f.centreId);
  }
  const sql = `SELECT t.code, t.date, t.category, t.description, t.amount, t.payment_method, c.name as centre, p.name as player
    FROM transactions t LEFT JOIN centres c ON c.id=t.related_centre_id LEFT JOIN players p ON p.id=t.related_player_id
    WHERE ${clauses.join(" AND ")} ORDER BY t.date DESC`;
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return {
    headers: ["Transaction ID", "Date", "Category", "Description", "Amount", "Payment Method", "Centre", "Player"],
    rows: rows.map((r) => [r.code, r.date, r.category, r.description, r.amount, r.payment_method, r.centre, r.player]),
  };
}

function expenseReport(f: ReportFilters) {
  const db = getDb();
  const clauses: string[] = ["type='EXPENSE'"];
  const params: SqlParam[] = [];
  if (f.from) {
    clauses.push("date >= ?");
    params.push(f.from);
  }
  if (f.to) {
    clauses.push("date <= ?");
    params.push(f.to);
  }
  if (f.centreId) {
    clauses.push("related_centre_id = ?");
    params.push(f.centreId);
  }
  const sql = `SELECT t.code, t.date, t.category, t.description, t.amount, t.payment_method, c.name as centre
    FROM transactions t LEFT JOIN centres c ON c.id=t.related_centre_id
    WHERE ${clauses.join(" AND ")} ORDER BY t.date DESC`;
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return {
    headers: ["Transaction ID", "Date", "Category", "Description", "Amount", "Payment Method", "Centre"],
    rows: rows.map((r) => [r.code, r.date, r.category, r.description, r.amount, r.payment_method, r.centre]),
  };
}

function pendingPaymentReport(f: ReportFilters) {
  const db = getDb();
  const clauses: string[] = ["p.status='ACTIVE'", "p.payment_status IN ('PENDING','PARTIALLY_PAID','OVERDUE')"];
  const params: SqlParam[] = [];
  if (f.centreId) {
    clauses.push("p.centre_id = ?");
    params.push(f.centreId);
  }
  const sql = `SELECT p.code, p.name, p.phone, c.name as centre, p.monthly_fee, p.payment_status, p.updated_at
    FROM players p LEFT JOIN centres c ON c.id=p.centre_id WHERE ${clauses.join(" AND ")} ORDER BY p.updated_at DESC`;
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return {
    headers: ["Player ID", "Name", "Phone", "Centre", "Monthly Fee", "Payment Status", "Last Updated"],
    rows: rows.map((r) => [r.code, r.name, r.phone, r.centre, r.monthly_fee, r.payment_status, r.updated_at]),
  };
}

function coachReport(_f: ReportFilters) {
  const db = getDb();
  const sql = `SELECT co.code, co.name, co.phone, c.name as centre, co.employment_status,
      (SELECT COUNT(*) FROM players p WHERE p.coach_id = co.id AND p.status='ACTIVE') as active_players,
      (SELECT COUNT(*) FROM batches b WHERE b.coach_id = co.id) as batches
    FROM coaches co LEFT JOIN centres c ON c.id = co.centre_id ORDER BY co.name ASC`;
  const rows = db.prepare(sql).all() as Record<string, unknown>[];
  return {
    headers: ["Coach ID", "Name", "Phone", "Centre", "Status", "Active Players", "Batches"],
    rows: rows.map((r) => [r.code, r.name, r.phone, r.centre, r.employment_status, r.active_players, r.batches]),
  };
}

function centreReport(_f: ReportFilters) {
  const db = getDb();
  const sql = `SELECT c.code, c.name, c.city, c.status,
      (SELECT COUNT(*) FROM players p WHERE p.centre_id = c.id AND p.status='ACTIVE') as active_players,
      (SELECT COUNT(*) FROM batches b WHERE b.centre_id = c.id) as batches,
      (SELECT COUNT(DISTINCT coach_id) FROM players p WHERE p.centre_id = c.id AND p.coach_id IS NOT NULL) as coaches
    FROM centres c ORDER BY c.name ASC`;
  const rows = db.prepare(sql).all() as Record<string, unknown>[];
  return {
    headers: ["Centre ID", "Name", "City", "Status", "Active Players", "Batches", "Coaches"],
    rows: rows.map((r) => [r.code, r.name, r.city, r.status, r.active_players, r.batches, r.coaches]),
  };
}

function monthlyProfitReport(_f: ReportFilters) {
  const db = getDb();
  const sql = `SELECT strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type='REVENUE' THEN amount ELSE 0 END) as revenue,
      SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) as expense
    FROM transactions GROUP BY month ORDER BY month DESC`;
  const rows = db.prepare(sql).all() as { month: string; revenue: number; expense: number }[];
  return {
    headers: ["Month", "Revenue", "Expenses", "Net Profit"],
    rows: rows.map((r) => [r.month, r.revenue, r.expense, r.revenue - r.expense]),
  };
}
