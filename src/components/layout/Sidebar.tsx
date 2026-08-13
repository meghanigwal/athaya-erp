"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  UserCog,
  MapPin,
  Wallet,
  BarChart3,
  UploadCloud,
  History,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Target,
  Users,
  UserCog,
  MapPin,
  Wallet,
  BarChart3,
  UploadCloud,
  History,
  ShieldCheck,
};

export function Sidebar({ items, mobileOpen, onClose }: { items: NavItem[]; mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">AFA</div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Athaya Football</p>
              <p className="text-xs text-slate-400">Academy ERP</p>
            </div>
          </Link>
          <button onClick={onClose} className="text-slate-400 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 scrollbar-thin">
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-light text-brand-dark" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-brand-dark" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-400">Athaya Football Academy ERP v1.0</p>
        </div>
      </aside>
    </>
  );
}
