"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    logActivity({ user, action: "Logged Out", module: "Auth", description: `${user.name} logged out.` });
  }
  await clearSessionCookie();
  redirect("/login");
}
