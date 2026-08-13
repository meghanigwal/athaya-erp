"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings } from "lucide-react";
import { logoutAction } from "@/app/(app)/actions";
import { humanize } from "@/lib/utils";

export function Topbar({
  onMenuClick,
  userName,
  userRole,
  notificationCount,
}: {
  onMenuClick: () => void;
  userName: string;
  userRole: string;
  notificationCount: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <button onClick={onMenuClick} className="text-slate-500 lg:hidden">
        <Menu className="h-5.5 w-5.5" />
      </button>

      <form onSubmit={submitSearch} className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players, leads, coaches, centres..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark">
              {userName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-slate-800">{userName}</p>
              <p className="text-xs leading-tight text-slate-400">{humanize(userRole)}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <Link href="/settings" className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
