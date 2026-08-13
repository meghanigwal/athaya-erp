import { getDb, newId, nextCode } from "../db";
import type { ModuleKey, PermissionRow, Role, User } from "../types";
import { hashPassword } from "../auth";

export function listUsers(): User[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM users ORDER BY created_at ASC`).all() as unknown as User[];
}

export function getUser(id: string): User | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as User | undefined;
}

export function getUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase().trim()) as User | undefined;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string | null;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const db = getDb();
  const existing = getUserByEmail(input.email);
  if (existing) throw new Error("A user with this email already exists.");
  const id = newId();
  const code = nextCode("U");
  const passwordHash = await hashPassword(input.password);
  db.prepare(
    `INSERT INTO users (id, code, name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, code, input.name, input.email.toLowerCase().trim(), passwordHash, input.role, input.phone ?? null);
  return getUser(id)!;
}

export function updateUser(
  id: string,
  input: Partial<{ name: string; role: Role; status: string; phone: string | null }>
): User {
  const db = getDb();
  const current = getUser(id);
  if (!current) throw new Error("User not found");
  const merged = { ...current, ...input };
  db.prepare(`UPDATE users SET name=?, role=?, status=?, phone=?, updated_at=datetime('now') WHERE id=?`).run(
    merged.name,
    merged.role,
    merged.status,
    merged.phone,
    id
  );
  return getUser(id)!;
}

export async function resetPassword(id: string, password: string) {
  const db = getDb();
  const hash = await hashPassword(password);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(hash, id);
}

export function getUserPermissionRows(userId: string): PermissionRow[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM permissions WHERE user_id = ?`).all(userId) as unknown as PermissionRow[];
}

export function setPermission(
  userId: string,
  moduleKey: ModuleKey,
  perms: { can_view: boolean; can_add: boolean; can_edit: boolean; can_delete: boolean; can_export: boolean }
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO permissions (id, user_id, module, can_view, can_add, can_edit, can_delete, can_export)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, module) DO UPDATE SET can_view=excluded.can_view, can_add=excluded.can_add, can_edit=excluded.can_edit, can_delete=excluded.can_delete, can_export=excluded.can_export`
  ).run(
    newId(),
    userId,
    moduleKey,
    perms.can_view ? 1 : 0,
    perms.can_add ? 1 : 0,
    perms.can_edit ? 1 : 0,
    perms.can_delete ? 1 : 0,
    perms.can_export ? 1 : 0
  );
}
