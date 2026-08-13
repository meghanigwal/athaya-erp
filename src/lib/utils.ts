import { PLAYER_STATUSES } from "./types";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr.includes("T") || dateStr.includes("Z") ? dateStr : dateStr + "Z");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function startOfMonthIso(offsetMonths = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths, 1);
  return d.toISOString().slice(0, 10);
}

export function endOfMonthIso(offsetMonths = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths + 1, 0);
  return d.toISOString().slice(0, 10);
}

export function humanize(value: string | null | undefined): string {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function calcAge(dob: string | null | undefined): string {
  if (!dob) return "-";
  const b = new Date(dob);
  if (Number.isNaN(b.getTime())) return "-";
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return String(Math.max(age, 0));
}

export function isValidPlayerStatus(v: string): boolean {
  return (PLAYER_STATUSES as string[]).includes(v);
}

export function parseFormNumber(value: FormDataEntryValue | null, fallback = 0): number {
  if (value === null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function str(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const s = String(value).trim();
  return s.length === 0 ? null : s;
}
