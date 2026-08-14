import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "athaya.db");
const SCHEMA_PATH = path.join(process.cwd(), "src", "lib", "schema.sql");

/** True if `dir` is an actual mount point (different filesystem device than its parent). */
function isBindMounted(dir: string): boolean {
  try {
    const target = fs.statSync(dir);
    const parent = fs.statSync(path.dirname(dir));
    return target.dev !== parent.dev;
  } catch {
    return false;
  }
}

/**
 * Safety net against a real incident: on 2026-08-14 the app's container
 * briefly started before Railway finished attaching the persistent Volume
 * at DATA_DIR. The app didn't notice, silently created a fresh empty
 * database on the container's throwaway local disk, and a since-removed
 * startup script reseeded it with blank default accounts — permanently
 * overwriting real data once the container (and its throwaway disk)
 * eventually recycled.
 *
 * This check refuses to open the database until DATA_DIR is confirmed to
 * be a genuine mount point — proof the Volume is actually attached — and
 * throws (deliberately crashing the process) if that never happens within
 * 20 seconds, rather than silently continuing on non-persistent storage.
 * Railway's restart policy will retry the container, and by then the
 * Volume is essentially always attached. Only enforced when Railway has a
 * Volume configured for this service; local development has no volume and
 * is unaffected.
 */
function assertPersistentStorageReady(): void {
  if (!process.env.RAILWAY_VOLUME_MOUNT_PATH) return;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const maxWaitMs = 20000;
  const stepMs = 250;
  let waited = 0;
  while (!isBindMounted(DATA_DIR)) {
    if (waited >= maxWaitMs) {
      throw new Error(
        `FATAL: persistent-storage safety check failed. Expected the Railway Volume to be mounted at ${DATA_DIR}, ` +
          `but it was not detected after waiting ${maxWaitMs}ms. Refusing to start on non-persistent storage to avoid ` +
          `silently losing data — crashing intentionally so Railway retries the deploy.`
      );
    }
    try {
      execSync(`sleep ${stepMs / 1000}`);
    } catch {
      // ignore — just keep polling
    }
    waited += stepMs;
  }
}

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
  assertPersistentStorageReady();
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
