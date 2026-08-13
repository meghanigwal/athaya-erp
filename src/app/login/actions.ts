"use server";

import { redirect } from "next/navigation";
import { getUserByEmail } from "@/lib/modules/users";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const user = getUserByEmail(email);
  if (!user) {
    return { error: "No account found with this email." };
  }
  if (user.status !== "ACTIVE") {
    return { error: "Your account has been deactivated. Contact your Super Admin." };
  }

  const valid = await verifyPassword(password, (user as unknown as { password_hash: string }).password_hash);
  if (!valid) {
    return { error: "Incorrect password. Please try again." };
  }

  await setSessionCookie({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
  logActivity({ user, action: "Logged In", module: "Auth", description: `${user.name} logged in.` });

  redirect(next && next.startsWith("/") ? next : "/dashboard");
}
