"use server";

import { assertCan, requireUser } from "@/lib/auth";
import {
  parseSpreadsheet,
  autoMap,
  fieldsForModule,
  commitPlayerImport,
  commitLeadImport,
  type ImportModule,
  type ImportOptions,
} from "@/lib/modules/importer";

export interface ParseResult {
  error?: string;
  headers?: string[];
  rows?: Record<string, string>[];
  mapping?: Record<string, string | null>;
  fields?: { key: string; label: string; required?: boolean }[];
}

export async function parseImportFileAction(formData: FormData): Promise<ParseResult> {
  await assertCan("import", "add");
  const file = formData.get("file") as File | null;
  const mod = String(formData.get("module") ?? "players") as ImportModule;
  if (!file || file.size === 0) return { error: "Please choose a file to upload." };

  const MAX_ROWS = 5000;
  try {
    const buffer = await file.arrayBuffer();
    const { headers, rows } = await parseSpreadsheet(buffer, file.name);
    if (rows.length === 0) return { error: "No data rows were found in this file." };
    if (rows.length > MAX_ROWS) {
      return { error: `This file has ${rows.length} rows. Please split files larger than ${MAX_ROWS} rows.` };
    }
    const mapping = autoMap(headers, mod);
    const fields = fieldsForModule(mod).map((f) => ({ key: f.key, label: f.label, required: f.required }));
    return { headers, rows, mapping, fields };
  } catch {
    return { error: "Could not read this file. Please upload a valid .xlsx or .csv file." };
  }
}

export interface CommitResult {
  error?: string;
  summary?: { found: number; imported: number; updated: number; skipped: number; errors: number; errorDetails: string[] };
}

export async function commitImportAction(
  mod: ImportModule,
  rows: Record<string, string>[],
  mapping: Record<string, string | null>,
  options: ImportOptions,
  fileName: string
): Promise<CommitResult> {
  try {
    await assertCan("import", "add");
    const user = await requireUser();
    if (rows.length === 0) return { error: "No rows to import." };

    const summary =
      mod === "players"
        ? commitPlayerImport(rows, mapping, options, user, fileName)
        : commitLeadImport(rows, mapping, options, user, fileName);

    return { summary };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Import failed." };
  }
}
