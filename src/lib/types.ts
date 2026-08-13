export type Role = "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";

export const MODULES = [
  "dashboard",
  "leads",
  "players",
  "coaches",
  "centres",
  "finance",
  "reports",
  "import",
  "activity",
  "users",
] as const;
export type ModuleKey = (typeof MODULES)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  leads: "Leads & Sales",
  players: "Players",
  coaches: "Coaches & Staff",
  centres: "Centres & Batches",
  finance: "Finance & Accounts",
  reports: "Reports",
  import: "Data Import Centre",
  activity: "Activity Log",
  users: "Users & Permissions",
};

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
}

export interface User extends SessionUser {
  code: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionRow {
  module: ModuleKey;
  can_view: number;
  can_add: number;
  can_edit: number;
  can_delete: number;
  can_export: number;
}

export interface Centre {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  code: string;
  name: string;
  centre_id: string | null;
  coach_id: string | null;
  schedule: string | null;
  age_group: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface Coach {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  qualification: string | null;
  experience: string | null;
  joining_date: string | null;
  centre_id: string | null;
  employment_status: "ACTIVE" | "INACTIVE";
  salary_info: string | null;
  notes: string | null;
}

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "TRIAL_SCHEDULED"
  | "TRIAL_COMPLETED"
  | "CONVERTED"
  | "NOT_INTERESTED"
  | "LOST";

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "TRIAL_SCHEDULED",
  "TRIAL_COMPLETED",
  "CONVERTED",
  "NOT_INTERESTED",
  "LOST",
];

export interface Lead {
  id: string;
  code: string;
  parent_name: string | null;
  child_name: string;
  child_age: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  city: string | null;
  source: string | null;
  programme: string | null;
  centre_id: string | null;
  lead_date: string | null;
  assigned_user_id: string | null;
  status: LeadStatus;
  follow_up_date: string | null;
  notes: string | null;
  expected_fee: number | null;
  conversion_status: "OPEN" | "CONVERTED" | "LOST";
  created_at: string;
  updated_at: string;
}

export type PlayerStatus = "ACTIVE" | "TRIAL" | "ON_HOLD" | "INACTIVE" | "LEFT_ACADEMY";
export const PLAYER_STATUSES: PlayerStatus[] = [
  "ACTIVE",
  "TRIAL",
  "ON_HOLD",
  "INACTIVE",
  "LEFT_ACADEMY",
];

export type PaymentStatus = "PAID" | "PARTIALLY_PAID" | "PENDING" | "OVERDUE";
export const PAYMENT_STATUSES: PaymentStatus[] = ["PAID", "PARTIALLY_PAID", "PENDING", "OVERDUE"];

export interface Player {
  id: string;
  code: string;
  name: string;
  dob: string | null;
  age: string | null;
  gender: string | null;
  parent_name: string | null;
  father_mother_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  society: string | null;
  city: string | null;
  centre_id: string | null;
  batch_id: string | null;
  age_group: string | null;
  coach_id: string | null;
  joining_date: string | null;
  registration_date: string | null;
  programme: string | null;
  monthly_fee: number;
  registration_fee: number;
  payment_status: PaymentStatus;
  status: PlayerStatus;
  emergency_contact: string | null;
  notes: string | null;
  lead_id: string | null;
  is_sample: number;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "UPI" | "ONLINE_PAYMENT" | "OTHER";
export const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "BANK_TRANSFER",
  "UPI",
  "ONLINE_PAYMENT",
  "OTHER",
];

export interface Payment {
  id: string;
  code: string;
  player_id: string;
  amount: number;
  for_month: string | null;
  due_date: string | null;
  payment_date: string | null;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  notes: string | null;
  added_by_user_id: string | null;
  created_at: string;
}

export type TransactionType = "REVENUE" | "EXPENSE";

export const REVENUE_CATEGORIES = [
  "Player Fees",
  "Registration Fees",
  "Monthly Fees",
  "Tournament Fees",
  "Other Income",
];
export const EXPENSE_CATEGORIES = [
  "Coach Payments",
  "Salaries",
  "Ground/Pitch Expenses",
  "Equipment",
  "Marketing",
  "Travel",
  "Tournament Expenses",
  "Office Expenses",
  "Other Expenses",
];

export interface Transaction {
  id: string;
  code: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string | null;
  amount: number;
  payment_method: PaymentMethod;
  related_player_id: string | null;
  related_centre_id: string | null;
  added_by_user_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  module: string;
  record_id: string | null;
  record_label: string | null;
  previous_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
}

export interface ImportHistory {
  id: string;
  file_name: string;
  module: string;
  imported_by_user_id: string | null;
  records_found: number;
  records_imported: number;
  records_updated: number;
  records_skipped: number;
  records_errors: number;
  created_at: string;
}
