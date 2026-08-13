import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import type { ModuleKey, PermissionRow, Role, SessionUser, User } from "./types";

const COOKIE_NAME = "athaya_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET || "athaya-football-academy-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/** Get the current user, re-checked against the DB (so status/role changes apply immediately) */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const db = getDb();
  const u = db.prepare(`SELECT * FROM users WHERE id = ?`).get(session.id) as User | undefined;
  if (!u || u.status !== "ACTIVE") return null;
  return u;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}

const DEFAULT_ROLE_PERMISSIONS: Record<Role, ModuleKey[]> = {
  SUPER_ADMIN: ["dashboard", "leads", "players", "coaches", "centres", "finance", "reports", "import", "activity", "users"],
  ADMIN: ["dashboard", "leads", "players", "coaches", "centres", "finance", "reports", "import", "activity"],
  EMPLOYEE: ["dashboard", "leads", "players"],
};

export function getPermissions(userId: string, role: Role): Record<ModuleKey, PermissionRow> {
  const db = getDb();
  const custom = db
    .prepare(`SELECT * FROM permissions WHERE user_id = ?`)
    .all(userId) as unknown as PermissionRow[];
  const map = new Map(custom.map((p) => [p.module, p]));

  const result = {} as Record<ModuleKey, PermissionRow>;
  const allowedByDefault = DEFAULT_ROLE_PERMISSIONS[role];

  for (const mod of Object.keys(MODULE_DEFAULTS) as ModuleKey[]) {
    const existing = map.get(mod);
    if (existing) {
      result[mod] = existing;
    } else if (role === "SUPER_ADMIN") {
      result[mod] = { module: mod, can_view: 1, can_add: 1, can_edit: 1, can_delete: 1, can_export: 1 };
    } else if (allowedByDefault.includes(mod)) {
      const financeVisible = mod !== "finance" || role === "ADMIN";
      result[mod] = {
        module: mod,
        can_view: financeVisible ? 1 : 0,
        can_add: mod === "users" ? 0 : role === "ADMIN" ? 1 : mod === "leads" || mod === "players" ? 1 : 0,
        can_edit: mod === "users" ? 0 : role === "ADMIN" ? 1 : mod === "leads" || mod === "players" ? 1 : 0,
        can_delete: role === "ADMIN" ? 1 : 0,
        can_export: role === "ADMIN" ? 1 : 0,
      };
    } else {
      result[mod] = { module: mod, can_view: 0, can_add: 0, can_edit: 0, can_delete: 0, can_export: 0 };
    }
  }
  return result;
}

const MODULE_DEFAULTS: Record<ModuleKey, true> = {
  dashboard: true,
  leads: true,
  players: true,
  coaches: true,
  centres: true,
  finance: true,
  reports: true,
  import: true,
  activity: true,
  users: true,
};

export async function can(
  moduleKey: ModuleKey,
  action: "view" | "add" | "edit" | "delete" | "export"
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  const perms = getPermissions(user.id, user.role);
  const p = perms[moduleKey];
  if (!p) return false;
  return Boolean(p[`can_${action}`]);
}

export async function assertCan(moduleKey: ModuleKey, action: "view" | "add" | "edit" | "delete" | "export") {
  const allowed = await can(moduleKey, action);
  if (!allowed) throw new Error("You do not have permission to perform this action.");
}

/**
 * Permanently deleting individual records is restricted to Super Admin and Admin accounts only,
 * regardless of any custom per-module permission settings. Use this for UI visibility checks.
 */
export async function canDeleteRecords(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN");
}

/** Server-action guard: throws unless the current user is Super Admin or Admin. */
export async function requireDeletePrivilege(): Promise<User> {
  return requireRole("SUPER_ADMIN", "ADMIN");
}
