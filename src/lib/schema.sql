-- ATHAYA FOOTBALL ACADEMY ERP — Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN','ADMIN','EMPLOYEE')),
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_view INTEGER NOT NULL DEFAULT 0,
  can_add INTEGER NOT NULL DEFAULT 0,
  can_edit INTEGER NOT NULL DEFAULT 0,
  can_delete INTEGER NOT NULL DEFAULT 0,
  can_export INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, module)
);

CREATE TABLE IF NOT EXISTS centres (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coaches (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT,
  qualification TEXT,
  experience TEXT,
  joining_date TEXT,
  centre_id TEXT REFERENCES centres(id) ON DELETE SET NULL,
  employment_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (employment_status IN ('ACTIVE','INACTIVE')),
  salary_info TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  centre_id TEXT REFERENCES centres(id) ON DELETE SET NULL,
  coach_id TEXT REFERENCES coaches(id) ON DELETE SET NULL,
  schedule TEXT,
  age_group TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  parent_name TEXT,
  child_name TEXT NOT NULL,
  child_age TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  location TEXT,
  city TEXT,
  source TEXT,
  programme TEXT,
  centre_id TEXT REFERENCES centres(id) ON DELETE SET NULL,
  lead_date TEXT,
  assigned_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','CONTACTED','FOLLOW_UP','TRIAL_SCHEDULED','TRIAL_COMPLETED','CONVERTED','NOT_INTERESTED','LOST')),
  follow_up_date TEXT,
  notes TEXT,
  expected_fee REAL,
  conversion_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (conversion_status IN ('OPEN','CONVERTED','LOST')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  dob TEXT,
  age TEXT,
  gender TEXT,
  parent_name TEXT,
  father_mother_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  society TEXT,
  city TEXT,
  centre_id TEXT REFERENCES centres(id) ON DELETE SET NULL,
  batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
  age_group TEXT,
  coach_id TEXT REFERENCES coaches(id) ON DELETE SET NULL,
  joining_date TEXT,
  registration_date TEXT,
  programme TEXT,
  monthly_fee REAL NOT NULL DEFAULT 0,
  registration_fee REAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PAID','PARTIALLY_PAID','PENDING','OVERDUE')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','TRIAL','ON_HOLD','INACTIVE','LEFT_ACADEMY')),
  emergency_contact TEXT,
  notes TEXT,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  is_sample INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  for_month TEXT,
  due_date TEXT,
  payment_date TEXT,
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH','BANK_TRANSFER','UPI','ONLINE_PAYMENT','OTHER')),
  status TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID','PARTIALLY_PAID','PENDING','OVERDUE')),
  notes TEXT,
  added_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('REVENUE','EXPENSE')),
  category TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH','BANK_TRANSFER','UPI','ONLINE_PAYMENT','OTHER')),
  related_player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
  related_centre_id TEXT REFERENCES centres(id) ON DELETE SET NULL,
  added_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT,
  record_label TEXT,
  previous_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS import_history (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  module TEXT NOT NULL,
  imported_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  records_found INTEGER NOT NULL DEFAULT 0,
  records_imported INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  records_skipped INTEGER NOT NULL DEFAULT 0,
  records_errors INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS counters (
  prefix TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_players_centre ON players(centre_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_player ON payments(player_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);
