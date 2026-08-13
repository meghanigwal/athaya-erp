# Athaya Football Academy — ERP (Version 1)

A simple, professional ERP for Athaya Football Academy — a doorstep football academy running training at residential societies, schools and local centres. Built to replace scattered Excel sheets with one dashboard the whole team can use.

## What's included

- **Dashboard** — KPI cards, revenue/leads/registrations charts, pending payments, recent activity, upcoming follow-ups, with Today / This Week / This Month / Last Month / Custom date filters.
- **Leads & Sales** — CRM-style pipeline (New → Contacted → Follow-up → Trial → Converted/Lost), one-click convert-to-player.
- **Players** — Central player database with full profile (player, parent, training, fee, payment history, activity history).
- **Coaches & Staff** — Coach records, centre assignment, players/batches per coach.
- **Centres & Batches** — Centre → Batch → Coach → Players structure.
- **Finance & Accounts** — Revenue/expense transactions, financial dashboard, filtering by date/centre/category/payment method.
- **Fee Tracking** — Record player payments; payment status (Paid/Partially Paid/Pending/Overdue) recalculates automatically and feeds Finance.
- **Reports** — 9 report types (Player, Lead, Lead Conversion, Revenue, Expense, Pending Payment, Coach, Centre, Monthly Profit) with filters and CSV/Excel export.
- **Data Import Centre** — Upload Excel (.xlsx) or CSV, map columns to ERP fields, preview, choose Add New / Update Existing, see an import summary. Duplicate detection is by phone number. Import history is kept.
- **Activity Log** — Every create/update/status-change/payment/import is recorded with who, what, when, old value → new value.
- **Users & Permissions** — Super Admin creates users and sets a per-module View/Add/Edit/Delete/Export permission matrix for Admins and Employees.
- **Global Search** — Search players, leads, coaches and centres from the top bar.
- **Notifications** — Overdue follow-ups and pending payments surfaced in the bell menu.

Sample/demo data (players, leads, coaches, centres, finance) is seeded so you can explore the system immediately — see [Sample data](#sample-data--going-live) below for how to clear it before real use.

## Tech stack

- **Next.js 16** (App Router, Server Actions, TypeScript, Turbopack)
- **SQLite** via Node's built-in `node:sqlite` module — no external database server, no native build step, the whole app runs from a single `data/athaya.db` file.
- **Tailwind CSS v4** for styling, **Recharts** for charts, **ExcelJS** / **PapaParse** for Excel/CSV import & export, **bcryptjs** + **jose** for authentication.

No Prisma, no ORM binaries to download — this was a deliberate choice so the app runs the same way in a locked-down or offline environment as it does anywhere else.

## Requirements

- **Node.js 22.5 or later** (tested on 22.22). `node:sqlite` is a stable-enough "experimental" API in this Node line — you'll see a one-line `ExperimentalWarning` in the server logs, which is expected and harmless.
- npm (or pnpm/yarn if you prefer, adjust commands accordingly).

## Getting started

```bash
npm install
npm run seed          # creates data/athaya.db and loads sample data + login accounts
npm run dev            # http://localhost:3000
```

For a production run:

```bash
npm run build
npm start
```

### Login accounts (seeded)

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | owner@athayafootball.com | Athaya@123 |
| Admin | admin@athayafootball.com | Athaya@123 |
| Employee | rahul@athayafootball.com | Athaya@123 |
| Employee | sneha@athayafootball.com | Athaya@123 |

**Change these passwords (Settings → Change Password, or Users & Permissions → reset) before giving anyone real access.**

### Useful scripts

```bash
npm run seed          # seed only if the database is empty
npm run seed:reset    # wipe the database and reseed with fresh sample data
npm run lint           # ESLint
```

## Configuration

Set `SESSION_SECRET` in your environment before deploying for real (a `.env.local` file works fine with Next.js):

```
SESSION_SECRET=some-long-random-string
```

If it's not set, a fixed development fallback is used — fine for trying the app locally, **not fine for production**.

## Data & backups

Everything lives in `data/athaya.db` (plus its `-wal`/`-shm` sidecar files while the app is running). To back up: stop the app (or run `sqlite3 data/athaya.db ".backup data/backup.db"` while it's running) and copy that file somewhere safe on a schedule (daily is plenty for a business this size). To restore, stop the app, replace `data/athaya.db`, and start it again.

This is intentionally simple for Version 1. If the academy outgrows a single SQLite file (many concurrent employees, multi-city scale), the data layer is isolated in `src/lib/db.ts` and `src/lib/modules/*.ts` — swapping in Postgres later means rewriting that layer, not the UI.

## Sample data & going live

Players created by the seed script are flagged internally (`is_sample`) so they're identifiable. Before go-live:

1. Run `npm run seed:reset` on a fresh `data/` folder (or delete `data/athaya.db*` and run `npm run seed` once) to start clean, **or**
2. Manually delete the sample Leads/Players/Coaches/Centres/Finance records from the UI once you've imported your real Excel data via the **Data Import Centre**.

Then use **Data Import Centre → Players / Leads** to bring in your existing Excel sheets. It auto-suggests column mapping (e.g. "Parent Mobile" → Phone Number), shows a preview, detects duplicates by phone number, and never deletes existing records.

## Roles & permissions

- **Super Admin** — full access to everything, only role that can create users and change permissions.
- **Admin** — day-to-day operations: Leads, Players, Coaches, Payments, Finance, Reports. Cannot manage users.
- **Employee** — Leads, Players, Dashboard by default. Exact access per module (View/Add/Edit/Delete/Export) is configurable per employee from **Users & Permissions**.

## Project structure

```
src/
  app/
    login/                 public login page
    (app)/                 authenticated app shell (sidebar + topbar) and all modules
    api/export/             CSV/Excel export endpoints
  components/                shared UI (buttons, tables, cards, charts, layout)
  lib/
    db.ts, schema.sql        SQLite connection + schema
    auth.ts                  sessions, password hashing, permission checks
    activity.ts               audit log helper
    modules/                   data-access layer, one file per business area
scripts/
  seed.mjs                    sample data seeder
  smoke-test.mjs, smoke-test2.mjs   end-to-end checks (Playwright)
```

## What was intentionally left out of Version 1

Per the brief: no payroll, no GST/tax automation, no advanced accounting, no parent/player mobile app, no advanced attendance or performance analysis, no tournament or inventory management, no AI analytics, no automated WhatsApp marketing. The data model (Centre → Batch → Coach → Players, unique IDs like `ATH-P-00001`, a full audit log) is built so these can be added later without a rebuild.
