import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "athaya.db");
const SCHEMA_PATH = path.join(process.cwd(), "src", "lib", "schema.sql");

declare global {
  var __athayaDb: DatabaseSync | undefined;
}

/**
 * node:sqlite returns rows as null-prototype objects. React's "use client"
 * boundary rejects those ("Only plain objects... can be passed to Client
 * Components"), so we transparently normalize every row to a plain object
 * right where statements are prepared — no call site needs to know about it.
 */
function toPlainRow<T>(r: T): T {
  if (r && typeof r === "object") {
    return Object.assign({}, r) as T;
  }
  return r;
}

function wrapStatement(stmt: ReturnType<DatabaseSync["prepare"]>) {
  return new Proxy(stmt, {
    get(target, prop, receiver) {
      if (prop === "all") {
        return (...args: SqlParam[]) => (target.all as (...a: SqlParam[]) => unknown[])(...args).map(toPlainRow);
      }
      if (prop === "get") {
        return (...args: SqlParam[]) => toPlainRow((target.get as (...a: SqlParam[]) => unknown)(...args));
      }
      if (prop === "iterate") {
        return function* (...args: SqlParam[]) {
          const iter = (target.iterate as (...a: SqlParam[]) => IterableIterator<unknown>)(...args);
          for (const r of iter) {
            yield toPlainRow(r);
          }
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

function createConnection(): DatabaseSync {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  database.exec(schema);

  const originalPrepare = database.prepare.bind(database);
  database.prepare = ((sql: string) => wrapStatement(originalPrepare(sql))) as typeof database.prepare;

  return database;
}

export function getDb(): DatabaseSync {
  if (!global.__athayaDb) {
    global.__athayaDb = createConnection();
  }
  return global.__athayaDb;
}

/** Generate a new unique id (uuid-ish, url safe) */
export function newId(): string {
  return crypto.randomUUID();
}

/** Generate a sequential, human friendly code like ATH-P-00001 */
export function nextCode(prefix: string): string {
  const db = getDb();
  db.prepare(
    `INSERT INTO counters (prefix, value) VALUES (?, 1)
     ON CONFLICT(prefix) DO UPDATE SET value = value + 1`
  ).run(prefix);
  const row = db.prepare(`SELECT value FROM counters WHERE prefix = ?`).get(prefix) as
    | { value: number }
    | undefined;
  const n = row?.value ?? 1;
  return `ATH-${prefix}-${String(n).padStart(5, "0")}`;
}

/** Convert a SQLite row (null-prototype object) to a plain object */
export function row<T = Record<string, unknown>>(r: unknown): T {
  return r as T;
}

export function rows<T = Record<string, unknown>>(r: unknown): T[] {
  return r as T[];
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Valid parameter type accepted by node:sqlite prepared statements. */
export type SqlParam = string | number | null;
