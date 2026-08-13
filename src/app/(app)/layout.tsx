import { redirect } from "next/navigation";
import { getCurrentUser, getPermissions } from "@/lib/auth";
import { NAV_ITEMS } from "@/lib/nav";
import { AppShell } from "@/components/layout/AppShell";
import { overdueFollowUps } from "@/lib/modules/leads";
import { pendingPayments } from "@/lib/modules/players";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const permissions = getPermissions(user.id, user.role);
  const visibleNav = NAV_ITEMS.filter((item) => permissions[item.module]?.can_view);

  const notificationCount = overdueFollowUps(50).length + pendingPayments(50).length;

  return (
    <AppShell navItems={visibleNav} userName={user.name} userRole={user.role} notificationCount={notificationCount}>
      {children}
    </AppShell>
  );
}
