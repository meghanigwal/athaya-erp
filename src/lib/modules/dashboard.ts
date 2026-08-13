import { getDb } from "../db";
import { startOfMonthIso, endOfMonthIso } from "../utils";

export interface DateRange {
  from: string;
  to: string;
}

export function resolveRange(preset?: string, customFrom?: string, customTo?: string): DateRange {
  const today = new Date().toISOString().slice(0, 10);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "this_week": {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return { from: monday.toISOString().slice(0, 10), to: today };
    }
    case "last_month":
      return { from: startOfMonthIso(-1), to: endOfMonthIso(-1) };
    case "custom":
      if (customFrom && customTo) return { from: customFrom, to: customTo };
      return { from: startOfMonthIso(), to: endOfMonthIso() };
    case "this_month":
    default:
      return { from: startOfMonthIso(), to: endOfMonthIso() };
  }
}

export function dashboardKpis(range: DateRange) {
  const db = getDb();

  const totalActivePlayers = (db.prepare(`SELECT COUNT(*) as n FROM players WHERE status='ACTIVE'`).get() as { n: number }).n;
  const newPlayersThisRange = (
    db.prepare(`SELECT COUNT(*) as n FROM players WHERE joining_date BETWEEN ? AND ?`).get(range.from, range.to) as { n: number }
  ).n;
  const totalLeads = (db.prepare(`SELECT COUNT(*) as n FROM leads`).get() as { n: number }).n;
  const newLeadsThisRange = (
    db.prepare(`SELECT COUNT(*) as n FROM leads WHERE lead_date BETWEEN ? AND ?`).get(range.from, range.to) as { n: number }
  ).n;
  const convertedLeads = (db.prepare(`SELECT COUNT(*) as n FROM leads WHERE status='CONVERTED'`).get() as { n: number }).n;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;
  const monthlyRevenue = (
    db
      .prepare(`SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='REVENUE' AND date BETWEEN ? AND ?`)
      .get(range.from, range.to) as { total: number }
  ).total;
  const pendingPaymentsAmount = (
    db
      .prepare(
        `SELECT COALESCE(SUM(monthly_fee),0) as total FROM players WHERE status='ACTIVE' AND payment_status IN ('PENDING','PARTIALLY_PAID','OVERDUE')`
      )
      .get() as { total: number }
  ).total;
  const totalCoaches = (db.prepare(`SELECT COUNT(*) as n FROM coaches WHERE employment_status='ACTIVE'`).get() as { n: number }).n;
  const activeCentres = (db.prepare(`SELECT COUNT(*) as n FROM centres WHERE status='ACTIVE'`).get() as { n: number }).n;

  return {
    totalActivePlayers,
    newPlayersThisRange,
    totalLeads,
    newLeadsThisRange,
    convertedLeads,
    conversionRate,
    monthlyRevenue,
    pendingPaymentsAmount,
    totalCoaches,
    activeCentres,
  };
}

export function revenueTrend(months = 6) {
  const db = getDb();
  return db
    .prepare(
      `SELECT strftime('%Y-%m', date) as month, SUM(CASE WHEN type='REVENUE' THEN amount ELSE 0 END) as revenue, SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) as expense
       FROM transactions WHERE date >= date('now', ?) GROUP BY month ORDER BY month ASC`
    )
    .all(`-${months} months`) as { month: string; revenue: number; expense: number }[];
}

export function leadsTrend(days = 30) {
  const db = getDb();
  return db
    .prepare(
      `SELECT date(lead_date) as day, COUNT(*) as n FROM leads WHERE lead_date >= date('now', ?) GROUP BY day ORDER BY day ASC`
    )
    .all(`-${days} days`) as { day: string; n: number }[];
}

export function leadPipeline() {
  const db = getDb();
  return db.prepare(`SELECT status, COUNT(*) as n FROM leads GROUP BY status`).all() as { status: string; n: number }[];
}

export function playerRegistrationsTrend(months = 6) {
  const db = getDb();
  return db
    .prepare(
      `SELECT strftime('%Y-%m', joining_date) as month, COUNT(*) as n FROM players WHERE joining_date >= date('now', ?) GROUP BY month ORDER BY month ASC`
    )
    .all(`-${months} months`) as { month: string; n: number }[];
}

export function recentActivity(limit = 10) {
  const db = getDb();
  return db.prepare(`SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?`).all(limit);
}

export function upcomingActions(limit = 8) {
  const db = getDb();
  const followUps = db
    .prepare(
      `SELECT 'Follow up: ' || child_name as label, follow_up_date as due_date, 'lead' as kind, id
       FROM leads WHERE conversion_status='OPEN' AND follow_up_date IS NOT NULL AND follow_up_date >= date('now')
       ORDER BY follow_up_date ASC LIMIT ?`
    )
    .all(limit) as { label: string; due_date: string; kind: string; id: string }[];
  return followUps;
}
