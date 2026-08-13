"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth";
import { createUser, getUser, updateUser, resetPassword, setPermission } from "@/lib/modules/users";
import { logActivity } from "@/lib/activity";
import { str } from "@/lib/utils";
import { MODULES, type ModuleKey, type Role } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function createUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await requireRole("SUPER_ADMIN");
    const actor = await requireUser();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const role = (str(formData.get("role")) as Role) ?? "EMPLOYEE";

    if (!name || !email) return { error: "Name and email are required." };
    if (password.length < 6) return { error: "Password must be at least 6 characters." };

    const user = await createUser({ name, email, password, role, phone: str(formData.get("phone")) });
    logActivity({ user: actor, action: "User Created", module: "Users", recordId: user.id, recordLabel: user.name, description: `New ${role.replaceAll("_", " ").toLowerCase()} account created for ${user.name}.` });
    revalidatePath("/users");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect("/users");
}

export async function updateUserAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const actor = await requireRole("SUPER_ADMIN");
    const before = getUser(id);
    if (!before) return { error: "User not found." };
    if (before.role === "SUPER_ADMIN" && actor.id !== id) {
      return { error: "Super Admin accounts cannot be modified by other users." };
    }
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Name is required." };
    const role = (str(formData.get("role")) as Role) ?? before.role;
    const status = str(formData.get("status")) ?? before.status;

    if (before.role === "SUPER_ADMIN" && (role !== "SUPER_ADMIN" || status !== "ACTIVE")) {
      return { error: "You cannot change the Super Admin's own role or status here." };
    }

    const after = updateUser(id, { name, role, status, phone: str(formData.get("phone")) });
    logActivity({
      user: actor,
      action: "User Permissions Changed",
      module: "Users",
      recordId: id,
      recordLabel: after.name,
      description: `User ${after.name} updated (role: ${after.role}, status: ${after.status}).`,
    });

    const newPassword = str(formData.get("new_password"));
    if (newPassword) {
      if (newPassword.length < 6) return { error: "New password must be at least 6 characters." };
      await resetPassword(id, newPassword);
      logActivity({ user: actor, action: "Password Reset", module: "Users", recordId: id, recordLabel: after.name, description: `Password reset for ${after.name}.` });
    }

    revalidatePath("/users");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect("/users");
}

export async function savePermissionsAction(formData: FormData) {
  const actor = await requireRole("SUPER_ADMIN");
  const userId = String(formData.get("user_id"));
  const target = getUser(userId);
  if (!target) return;

  for (const mod of MODULES as readonly ModuleKey[]) {
    setPermission(userId, mod, {
      can_view: formData.get(`${mod}_view`) === "on",
      can_add: formData.get(`${mod}_add`) === "on",
      can_edit: formData.get(`${mod}_edit`) === "on",
      can_delete: formData.get(`${mod}_delete`) === "on",
      can_export: formData.get(`${mod}_export`) === "on",
    });
  }

  logActivity({
    user: actor,
    action: "User Permissions Changed",
    module: "Users",
    recordId: userId,
    recordLabel: target.name,
    description: `Module permissions updated for ${target.name}.`,
  });

  revalidatePath(`/users/${userId}`);
}
