"use server";

import { revalidatePath } from "next/cache";
import { requireUser, verifyPassword } from "@/lib/auth";
import { updateUser, resetPassword as resetPw } from "@/lib/modules/users";
import { logActivity } from "@/lib/activity";
import { str } from "@/lib/utils";

export interface FormState {
  error?: string;
  success?: string;
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await requireUser();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Name is required." };
    updateUser(user.id, { name, phone: str(formData.get("phone")) });
    logActivity({ user, action: "Updated", module: "Users", recordId: user.id, recordLabel: name, description: "Updated own profile details." });
    revalidatePath("/settings");
    return { success: "Profile updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await requireUser();
    const current = String(formData.get("current_password") ?? "");
    const next = String(formData.get("new_password") ?? "");
    if (next.length < 6) return { error: "New password must be at least 6 characters." };

    const dbUser = user as unknown as { password_hash: string };
    const valid = await verifyPassword(current, dbUser.password_hash);
    if (!valid) return { error: "Current password is incorrect." };

    await resetPw(user.id, next);
    logActivity({ user, action: "Password Reset", module: "Users", recordId: user.id, recordLabel: user.name, description: "Changed own password." });
    return { success: "Password changed successfully." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
}
