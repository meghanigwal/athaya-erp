import ExcelJS from "exceljs";
import Papa from "papaparse";
import { getDb, newId } from "../db";
import { createPlayer, updatePlayer, listPlayers } from "./players";
import { createLead, updateLead, listLeads } from "./leads";
import { logActivity } from "../activity";
import type { User } from "../types";

export type ImportModule = "players" | "leads";

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
}

export async function parseSpreadsheet(buffer: ArrayBuffer, filename: string): Promise<ParsedSheet> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    const headers = parsed.meta.fields ?? [];
    return { headers, rows: parsed.data };
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [] };

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    headers.push(String(cell.value ?? "").trim());
  });

  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((h, idx) => {
      const cell = row.getCell(idx + 1);
      let value: unknown = cell.value;
      if (value && typeof value === "object" && "text" in value) {
        value = (value as { text: string }).text;
      }
      if (value && typeof value === "object" && "result" in value) {
        value = (value as { result: unknown }).result;
      }
      const strValue = value === null || value === undefined ? "" : String(value).trim();
      if (strValue) hasValue = true;
      record[h] = strValue;
    });
    if (hasValue) rows.push(record);
  });

  return { headers, rows };
}

export interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  aliases: string[];
}

export const PLAYER_FIELDS: FieldDef[] = [
  { key: "name", label: "Player Name", required: true, aliases: ["player name", "name", "child name", "student name"] },
  { key: "dob", label: "Date of Birth", aliases: ["dob", "date of birth", "birth date"] },
  { key: "gender", label: "Gender", aliases: ["gender", "sex"] },
  { key: "parent_name", label: "Parent/Guardian Name", aliases: ["parent name", "guardian name", "parent/guardian"] },
  { key: "phone", label: "Phone Number", aliases: ["phone", "phone number", "parent mobile", "mobile", "contact number", "contact"] },
  { key: "whatsapp", label: "WhatsApp Number", aliases: ["whatsapp", "whatsapp number"] },
  { key: "email", label: "Email", aliases: ["email", "email address"] },
  { key: "address", label: "Address", aliases: ["address"] },
  { key: "society", label: "Society/Location", aliases: ["society", "location", "society/location"] },
  { key: "city", label: "City", aliases: ["city"] },
  { key: "centre_name", label: "Centre", aliases: ["centre", "center", "training centre"] },
  { key: "batch_name", label: "Batch", aliases: ["batch"] },
  { key: "coach_name", label: "Coach", aliases: ["coach", "coach name"] },
  { key: "joining_date", label: "Joining Date", aliases: ["joining date", "join date"] },
  { key: "programme", label: "Programme", aliases: ["programme", "program"] },
  { key: "monthly_fee", label: "Monthly Fee", aliases: ["monthly fee", "fee"] },
  { key: "registration_fee", label: "Registration Fee", aliases: ["registration fee", "reg fee"] },
  { key: "status", label: "Player Status", aliases: ["status", "player status"] },
  { key: "emergency_contact", label: "Emergency Contact", aliases: ["emergency contact"] },
  { key: "notes", label: "Notes", aliases: ["notes", "remarks"] },
];

export const LEAD_FIELDS: FieldDef[] = [
  { key: "child_name", label: "Child Name", required: true, aliases: ["child name", "player name", "name"] },
  { key: "parent_name", label: "Parent/Guardian Name", aliases: ["parent name", "guardian name"] },
  { key: "child_age", label: "Child Age", aliases: ["child age", "age"] },
  { key: "phone", label: "Phone Number", aliases: ["phone", "phone number", "mobile", "contact number"] },
  { key: "whatsapp", label: "WhatsApp Number", aliases: ["whatsapp"] },
  { key: "email", label: "Email", aliases: ["email"] },
  { key: "location", label: "Location/Society", aliases: ["location", "society"] },
  { key: "city", label: "City", aliases: ["city"] },
  { key: "source", label: "Source", aliases: ["source", "lead source"] },
  { key: "programme", label: "Interested Programme", aliases: ["programme", "interested programme"] },
  { key: "centre_name", label: "Interested Centre", aliases: ["centre", "interested centre", "center"] },
  { key: "lead_date", label: "Lead Date", aliases: ["lead date", "date"] },
  { key: "status", label: "Lead Status", aliases: ["status", "lead status"] },
  { key: "follow_up_date", label: "Follow-up Date", aliases: ["follow up date", "follow-up date"] },
  { key: "expected_fee", label: "Expected Fee", aliases: ["expected fee"] },
  { key: "notes", label: "Notes", aliases: ["notes", "remarks"] },
];

export function fieldsForModule(mod: ImportModule): FieldDef[] {
  return mod === "players" ? PLAYER_FIELDS : LEAD_FIELDS;
}

/** Best-effort automatic mapping from spreadsheet headers to ERP fields based on aliases. */
export function autoMap(headers: string[], mod: ImportModule): Record<string, string | null> {
  const fields = fieldsForModule(mod);
  const mapping: Record<string, string | null> = {};
  for (const field of fields) {
    const match = headers.find((h) => {
      const norm = h.toLowerCase().trim();
      return norm === field.label.toLowerCase() || field.aliases.includes(norm);
    });
    mapping[field.key] = match ?? null;
  }
  return mapping;
}

function normPhone(p: string | null | undefined): string {
  if (!p) return "";
  return p.replace(/\D/g, "").slice(-10);
}

function lookupCentreId(name: string | undefined): string | null {
  if (!name) return null;
  const db = getDb();
  const row = db.prepare(`SELECT id FROM centres WHERE LOWER(name) = LOWER(?)`).get(name.trim()) as
    | { id: string }
    | undefined;
  return row?.id ?? null;
}

function lookupBatchId(name: string | undefined): string | null {
  if (!name) return null;
  const db = getDb();
  const row = db.prepare(`SELECT id FROM batches WHERE LOWER(name) = LOWER(?)`).get(name.trim()) as
    | { id: string }
    | undefined;
  return row?.id ?? null;
}

function lookupCoachId(name: string | undefined): string | null {
  if (!name) return null;
  const db = getDb();
  const row = db.prepare(`SELECT id FROM coaches WHERE LOWER(name) = LOWER(?)`).get(name.trim()) as
    | { id: string }
    | undefined;
  return row?.id ?? null;
}

export interface ImportOptions {
  addNew: boolean;
  updateExisting: boolean;
}

export interface ImportSummary {
  found: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

export function commitPlayerImport(
  rows: Record<string, string>[],
  mapping: Record<string, string | null>,
  options: ImportOptions,
  user: User,
  fileName: string
): ImportSummary {
  const summary: ImportSummary = { found: rows.length, imported: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] };
  const existing = listPlayers();
  const byPhone = new Map(existing.filter((p) => p.phone).map((p) => [normPhone(p.phone), p]));

  for (const row of rows) {
    try {
      const get = (key: string) => (mapping[key] ? row[mapping[key]!] : undefined);
      const name = get("name")?.trim();
      if (!name) {
        summary.errors++;
        summary.errorDetails.push(`Missing player name in row: ${JSON.stringify(row)}`);
        continue;
      }
      const phone = get("phone")?.trim() || null;
      const key = normPhone(phone);
      const match = key ? byPhone.get(key) : undefined;

      const input = {
        name,
        dob: get("dob") || null,
        gender: get("gender") || null,
        parent_name: get("parent_name") || null,
        phone,
        whatsapp: get("whatsapp") || null,
        email: get("email") || null,
        address: get("address") || null,
        society: get("society") || null,
        city: get("city") || null,
        centre_id: lookupCentreId(get("centre_name")),
        batch_id: lookupBatchId(get("batch_name")),
        coach_id: lookupCoachId(get("coach_name")),
        joining_date: get("joining_date") || null,
        programme: get("programme") || null,
        monthly_fee: get("monthly_fee") ? Number(get("monthly_fee")) : 0,
        registration_fee: get("registration_fee") ? Number(get("registration_fee")) : 0,
        emergency_contact: get("emergency_contact") || null,
        notes: get("notes") || null,
        is_sample: 0,
      };

      if (match) {
        if (options.updateExisting) {
          updatePlayer(match.id, input);
          summary.updated++;
        } else {
          summary.skipped++;
        }
      } else {
        if (options.addNew) {
          const created = createPlayer(input);
          if (key) byPhone.set(key, created as never);
          summary.imported++;
        } else {
          summary.skipped++;
        }
      }
    } catch (err) {
      summary.errors++;
      summary.errorDetails.push(err instanceof Error ? err.message : "Unknown error");
    }
  }

  recordImportHistory("players", fileName, user, summary);
  logActivity({
    user,
    action: "Excel Imported",
    module: "Players",
    description: `Imported "${fileName}": ${summary.imported} added, ${summary.updated} updated, ${summary.skipped} skipped, ${summary.errors} errors`,
  });

  return summary;
}

export function commitLeadImport(
  rows: Record<string, string>[],
  mapping: Record<string, string | null>,
  options: ImportOptions,
  user: User,
  fileName: string
): ImportSummary {
  const summary: ImportSummary = { found: rows.length, imported: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] };
  const existing = listLeads();
  const byPhone = new Map(existing.filter((l) => l.phone).map((l) => [normPhone(l.phone), l]));

  for (const row of rows) {
    try {
      const get = (key: string) => (mapping[key] ? row[mapping[key]!] : undefined);
      const childName = get("child_name")?.trim();
      if (!childName) {
        summary.errors++;
        summary.errorDetails.push(`Missing child name in row: ${JSON.stringify(row)}`);
        continue;
      }
      const phone = get("phone")?.trim() || null;
      const key = normPhone(phone);
      const match = key ? byPhone.get(key) : undefined;

      const input = {
        child_name: childName,
        parent_name: get("parent_name") || null,
        child_age: get("child_age") || null,
        phone,
        whatsapp: get("whatsapp") || null,
        email: get("email") || null,
        location: get("location") || null,
        city: get("city") || null,
        source: get("source") || null,
        programme: get("programme") || null,
        centre_id: lookupCentreId(get("centre_name")),
        lead_date: get("lead_date") || null,
        follow_up_date: get("follow_up_date") || null,
        expected_fee: get("expected_fee") ? Number(get("expected_fee")) : null,
        notes: get("notes") || null,
      };

      if (match) {
        if (options.updateExisting) {
          updateLead(match.id, input);
          summary.updated++;
        } else {
          summary.skipped++;
        }
      } else {
        if (options.addNew) {
          const created = createLead(input);
          if (key) byPhone.set(key, created as never);
          summary.imported++;
        } else {
          summary.skipped++;
        }
      }
    } catch (err) {
      summary.errors++;
      summary.errorDetails.push(err instanceof Error ? err.message : "Unknown error");
    }
  }

  recordImportHistory("leads", fileName, user, summary);
  logActivity({
    user,
    action: "Excel Imported",
    module: "Leads",
    description: `Imported "${fileName}": ${summary.imported} added, ${summary.updated} updated, ${summary.skipped} skipped, ${summary.errors} errors`,
  });

  return summary;
}

function recordImportHistory(mod: string, fileName: string, user: User, summary: ImportSummary) {
  const db = getDb();
  db.prepare(
    `INSERT INTO import_history (id, file_name, module, imported_by_user_id, records_found, records_imported, records_updated, records_skipped, records_errors)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(newId(), fileName, mod, user.id, summary.found, summary.imported, summary.updated, summary.skipped, summary.errors);
}

export function listImportHistory() {
  const db = getDb();
  return db.prepare(
    `SELECT h.*, u.name as imported_by_name FROM import_history h LEFT JOIN users u ON u.id = h.imported_by_user_id ORDER BY h.created_at DESC`
  ).all();
}
