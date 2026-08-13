import type { ModuleKey } from "./types";

export interface NavItem {
  href: string;
  label: string;
  module: ModuleKey;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", module: "dashboard", icon: "LayoutDashboard" },
  { href: "/leads", label: "Leads & Sales", module: "leads", icon: "Target" },
  { href: "/players", label: "Players", module: "players", icon: "Users" },
  { href: "/coaches", label: "Coaches & Staff", module: "coaches", icon: "UserCog" },
  { href: "/centres", label: "Centres & Batches", module: "centres", icon: "MapPin" },
  { href: "/finance", label: "Finance & Accounts", module: "finance", icon: "Wallet" },
  { href: "/reports", label: "Reports", module: "reports", icon: "BarChart3" },
  { href: "/import", label: "Data Import Centre", module: "import", icon: "UploadCloud" },
  { href: "/activity", label: "Activity Log", module: "activity", icon: "History" },
  { href: "/users", label: "Users & Permissions", module: "users", icon: "ShieldCheck" },
];
