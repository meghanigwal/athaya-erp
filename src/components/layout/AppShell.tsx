"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { NavItem } from "@/lib/nav";
import type { ReactNode } from "react";

export function AppShell({
  navItems,
  userName,
  userRole,
  notificationCount,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  userRole: string;
  notificationCount: number;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={navItems} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} userName={userName} userRole={userRole} notificationCount={notificationCount} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
