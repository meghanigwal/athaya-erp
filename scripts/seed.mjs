#!/usr/bin/env node
// Seeds the ATHAYA FOOTBALL ACADEMY ERP database with a Super Admin account
// and realistic sample data (clearly flagged as sample where supported).
//
// Usage: node scripts/seed.mjs [--reset]

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "athaya.db");
const SCHEMA_PATH = path.join(ROOT, "src", "lib", "schema.sql");

const RESET = process.argv.includes("--reset");
const ACCOUNTS_ONLY = process.argv.includes("--accounts-only") || process.env.SEED_ACCOUNTS_ONLY === "1";

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (RESET) {
  // Remove the main db file AND its WAL/shared-memory sidecar files together —
  // deleting only the main file while stale -wal/-shm files remain (e.g. from
  // a still-running server process) can leave a fresh connection unable to
  // see data it just wrote.
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = DB_PATH + suffix;
    if (fs.existsSync(p)) fs.rmSync(p);
  }
  console.log("Existing database removed (--reset).");
}

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));

const id = () => crypto.randomUUID();

function nextCode(prefix) {
  db.prepare(
    `INSERT INTO counters (prefix, value) VALUES (?, 1) ON CONFLICT(prefix) DO UPDATE SET value = value + 1`
  ).run(prefix);
  const row = db.prepare(`SELECT value FROM counters WHERE prefix = ?`).get(prefix);
  return `ATH-${prefix}-${String(row.value).padStart(5, "0")}`;
}

const existingUsers = db.prepare(`SELECT COUNT(*) as n FROM users`).get();
if (existingUsers.n > 0 && !RESET) {
  console.log("Database already has users. Skipping seed (use --reset to start fresh).");
  process.exit(0);
}

console.log("Seeding ATHAYA FOOTBALL ACADEMY ERP...");

// ---------- Users ----------
const ownerPassword = "Athaya@123";
const adminPassword = "Athaya@123";
const employeePassword = "Athaya@123";

function insertUser(name, email, password, role, phone) {
  const uid = id();
  const code = nextCode("U");
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (id, code, name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(uid, code, name, email, hash, role, phone);
  return uid;
}

const ownerId = insertUser("Vaibhav Sahrawat", "owner@athayafootball.com", ownerPassword, "SUPER_ADMIN", "9810000001");
const adminId = insertUser("Priya Menon", "admin@athayafootball.com", adminPassword, "ADMIN", "9810000002");
const emp1Id = insertUser("Rahul Verma", "rahul@athayafootball.com", employeePassword, "EMPLOYEE", "9810000003");
const emp2Id = insertUser("Sneha Kapoor", "sneha@athayafootball.com", employeePassword, "EMPLOYEE", "9810000004");

if (ACCOUNTS_ONLY) {
  console.log("ACCOUNTS_ONLY mode: created login accounts only, no sample business data.");
  db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
  db.close();
  console.log("Seed complete.");
  console.log("");
  console.log("Login credentials:");
  console.log(`  Super Admin: owner@athayafootball.com / ${ownerPassword}`);
  console.log(`  Admin:       admin@athayafootball.com / ${adminPassword}`);
  console.log(`  Employee:    rahul@athayafootball.com / ${employeePassword}`);
  console.log(`  Employee:    sneha@athayafootball.com / ${employeePassword}`);
  process.exit(0);
}

// ---------- Centres ----------
function insertCentre(name, address, city) {
  const cid = id();
  const code = nextCode("CTR");
  db.prepare(`INSERT INTO centres (id, code, name, address, city) VALUES (?, ?, ?, ?, ?)`).run(cid, code, name, address, city);
  return cid;
}

const centreSukhdev = insertCentre("Sukhdev Vihar", "Community Park, Sukhdev Vihar", "New Delhi");
const centreGK = insertCentre("Greater Kailash", "GK-1 Sports Ground", "New Delhi");
const centreDLF = insertCentre("DLF Phase 2", "DLF Phase 2 Club Ground", "Gurugram");

// ---------- Coaches ----------
function insertCoach(name, phone, centreId, role, experience) {
  const coid = id();
  const code = nextCode("C");
  db.prepare(
    `INSERT INTO coaches (id, code, name, phone, email, role, qualification, experience, joining_date, centre_id, salary_info)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    coid,
    code,
    name,
    phone,
    name.toLowerCase().replace(/\s+/g, ".") + "@athayafootball.com",
    role,
    "AFC C License",
    experience,
    "2023-06-01",
    centreId,
    "₹25,000/month"
  );
  return coid;
}

const coach1 = insertCoach("Arjun Mehta", "9820000001", centreSukhdev, "Head Coach", "6 years");
const coach2 = insertCoach("Karan Singh", "9820000002", centreGK, "Coach", "4 years");
const coach3 = insertCoach("Farhan Ali", "9820000003", centreDLF, "Coach", "3 years");
const coach4 = insertCoach("Deepak Rawat", "9820000004", centreSukhdev, "Assistant Coach", "2 years");

// ---------- Batches ----------
function insertBatch(name, centreId, coachId, schedule, ageGroup) {
  const bid = id();
  const code = nextCode("BAT");
  db.prepare(
    `INSERT INTO batches (id, code, name, centre_id, coach_id, schedule, age_group) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(bid, code, name, centreId, coachId, schedule, ageGroup);
  return bid;
}

const batch1 = insertBatch("Sukhdev Vihar - Evening", centreSukhdev, coach1, "Mon / Wed / Fri - 5:00 PM", "6-9 yrs");
const batch2 = insertBatch("Sukhdev Vihar - Weekend", centreSukhdev, coach4, "Sat / Sun - 8:00 AM", "10-14 yrs");
const batch3 = insertBatch("GK Evening Batch", centreGK, coach2, "Tue / Thu / Sat - 5:30 PM", "6-9 yrs");
const batch4 = insertBatch("DLF Phase 2 Batch", centreDLF, coach3, "Mon / Wed / Fri - 6:00 PM", "10-14 yrs");

// ---------- Leads ----------
function insertLead(childName, parentName, age, phone, location, city, source, programme, centreId, leadDate, assignedTo, status, followUp, notes, expectedFee) {
  const lid = id();
  const code = nextCode("L");
  const conversionStatus = status === "CONVERTED" ? "CONVERTED" : status === "LOST" || status === "NOT_INTERESTED" ? "LOST" : "OPEN";
  db.prepare(
    `INSERT INTO leads (id, code, parent_name, child_name, child_age, phone, whatsapp, location, city, source, programme, centre_id, lead_date, assigned_user_id, status, follow_up_date, notes, expected_fee, conversion_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(lid, code, parentName, childName, age, phone, phone, location, city, source, programme, centreId, leadDate, assignedTo, status, followUp, notes, expectedFee, conversionStatus);
  return lid;
}

const today = new Date();
const iso = (daysOffset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
};

const leadSeed = [
  ["Aarav Sharma", "Rohit Sharma", "7", "9891234501", "Sukhdev Vihar", "New Delhi", "Referral", "Weekday Batch", centreSukhdev, iso(-20), emp1Id, "CONVERTED", null, "Converted after trial.", 2500],
  ["Vivaan Gupta", "Neha Gupta", "8", "9891234502", "GK-1", "New Delhi", "Instagram", "Weekend Batch", centreGK, iso(-18), emp2Id, "CONVERTED", null, "Great first trial.", 2500],
  ["Aditya Rao", "Suresh Rao", "9", "9891234503", "DLF Phase 2", "Gurugram", "Walk-in", "Weekday Batch", centreDLF, iso(-15), emp1Id, "TRIAL_COMPLETED", iso(2), "Awaiting parent decision.", 2200],
  ["Ishaan Verma", "Priyanka Verma", "6", "9891234504", "Sukhdev Vihar", "New Delhi", "Referral", "Weekday Batch", centreSukhdev, iso(-12), emp2Id, "FOLLOW_UP", iso(1), "Wants to discuss fee.", 2500],
  ["Reyansh Nair", "Anitha Nair", "10", "9891234505", "GK-1", "New Delhi", "Facebook Ads", "Weekend Batch", centreGK, iso(-10), emp1Id, "TRIAL_SCHEDULED", iso(3), "Trial fixed for Sunday.", 2200],
  ["Kabir Khanna", "Ritu Khanna", "8", "9891234506", "DLF Phase 2", "Gurugram", "Walk-in", "Weekday Batch", centreDLF, iso(-9), emp2Id, "CONTACTED", iso(0), "Called once, will call again.", 2200],
  ["Arjun Malhotra", "Deepa Malhotra", "7", "9891234507", "Sukhdev Vihar", "New Delhi", "Referral", "Weekday Batch", centreSukhdev, iso(-8), emp1Id, "NEW", iso(1), "Just enquired via WhatsApp.", 2500],
  ["Vihaan Chopra", "Sunil Chopra", "11", "9891234508", "GK-1", "New Delhi", "Instagram", "Weekend Batch", centreGK, iso(-7), emp2Id, "NEW", iso(2), "", 2200],
  ["Advik Bhatia", "Simran Bhatia", "9", "9891234509", "DLF Phase 2", "Gurugram", "Referral", "Weekday Batch", centreDLF, iso(-6), emp1Id, "LOST", null, "Went with another academy.", 2200],
  ["Dhruv Saxena", "Meena Saxena", "6", "9891234510", "Sukhdev Vihar", "New Delhi", "Walk-in", "Weekday Batch", centreSukhdev, iso(-5), emp2Id, "NOT_INTERESTED", null, "Budget constraints.", 2500],
  ["Aryan Joshi", "Kavita Joshi", "10", "9891234511", "GK-1", "New Delhi", "Facebook Ads", "Weekend Batch", centreGK, iso(-3), emp1Id, "FOLLOW_UP", iso(1), "Requested call back next week.", 2200],
  ["Sai Kulkarni", "Anil Kulkarni", "8", "9891234512", "DLF Phase 2", "Gurugram", "Referral", "Weekday Batch", centreDLF, iso(-2), emp2Id, "NEW", iso(4), "", 2200],
  ["Ayaan Iyer", "Lakshmi Iyer", "7", "9891234513", "Sukhdev Vihar", "New Delhi", "Instagram", "Weekday Batch", centreSukhdev, iso(-1), emp1Id, "NEW", iso(5), "", 2500],
  ["Rudra Pillai", "Divya Pillai", "9", "9891234514", "GK-1", "New Delhi", "Walk-in", "Weekend Batch", centreGK, iso(0), emp2Id, "NEW", iso(3), "", 2200],
  ["Krishna Menon", "Radhika Menon", "10", "9891234515", "DLF Phase 2", "Gurugram", "Referral", "Weekday Batch", centreDLF, iso(0), emp1Id, "CONTACTED", iso(2), "", 2200],
];

const leadIds = leadSeed.map((row) => insertLead(...row));

// ---------- Players ----------
function insertPlayer(name, dob, gender, parentName, phone, society, city, centreId, batchId, coachId, joiningDate, programme, monthlyFee, regFee, status, leadId) {
  const pid = id();
  const code = nextCode("P");
  db.prepare(
    `INSERT INTO players (id, code, name, dob, gender, parent_name, phone, whatsapp, society, city, centre_id, batch_id, age_group, coach_id, joining_date, registration_date, programme, monthly_fee, registration_fee, payment_status, status, lead_id, is_sample)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, 1)`
  ).run(pid, code, name, dob, gender, parentName, phone, phone, society, city, centreId, batchId, "6-14 yrs", coachId, joiningDate, joiningDate, programme, monthlyFee, regFee, status, leadId);
  return pid;
}

const playerSeed = [
  ["Aarav Sharma", "2018-04-11", "Male", "Rohit Sharma", "9891234501", "Sukhdev Vihar", "New Delhi", centreSukhdev, batch1, coach1, iso(-20), "Weekday Batch", 2500, 1500, "ACTIVE", leadIds[0]],
  ["Vivaan Gupta", "2017-09-02", "Male", "Neha Gupta", "9891234502", "GK-1", "New Delhi", centreGK, batch3, coach2, iso(-18), "Weekend Batch", 2500, 1500, "ACTIVE", leadIds[1]],
  ["Meera Anand", "2016-01-15", "Female", "Sanjay Anand", "9891234520", "Sukhdev Vihar", "New Delhi", centreSukhdev, batch2, coach4, iso(-90), "Weekend Batch", 2500, 1500, "ACTIVE", null],
  ["Rohan Kapoor", "2015-11-20", "Male", "Manoj Kapoor", "9891234521", "GK-1", "New Delhi", centreGK, batch3, coach2, iso(-75), "Weekday Batch", 2200, 1500, "ACTIVE", null],
  ["Anaya Bose", "2017-06-08", "Female", "Rajesh Bose", "9891234522", "DLF Phase 2", "Gurugram", centreDLF, batch4, coach3, iso(-60), "Weekday Batch", 2200, 1500, "ACTIVE", null],
  ["Kabir Ahuja", "2016-03-25", "Male", "Vikram Ahuja", "9891234523", "Sukhdev Vihar", "New Delhi", centreSukhdev, batch1, coach1, iso(-55), "Weekday Batch", 2500, 1500, "ACTIVE", null],
  ["Diya Malhotra", "2018-08-30", "Female", "Sameer Malhotra", "9891234524", "GK-1", "New Delhi", centreGK, batch3, coach2, iso(-50), "Weekend Batch", 2500, 1500, "TRIAL", null],
  ["Yuvraj Singh", "2015-05-17", "Male", "Harpreet Singh", "9891234525", "DLF Phase 2", "Gurugram", centreDLF, batch4, coach3, iso(-45), "Weekday Batch", 2200, 1500, "ACTIVE", null],
  ["Ira Chandra", "2017-12-01", "Female", "Amit Chandra", "9891234526", "Sukhdev Vihar", "New Delhi", centreSukhdev, batch2, coach4, iso(-40), "Weekend Batch", 2500, 1500, "ACTIVE", null],
  ["Vihaan Rathi", "2016-07-19", "Male", "Nitin Rathi", "9891234527", "GK-1", "New Delhi", centreGK, batch3, coach2, iso(-35), "Weekday Batch", 2200, 1500, "ON_HOLD", null],
  ["Saanvi Oberoi", "2018-02-14", "Female", "Gaurav Oberoi", "9891234528", "DLF Phase 2", "Gurugram", centreDLF, batch4, coach3, iso(-33), "Weekday Batch", 2200, 1500, "ACTIVE", null],
  ["Arnav Trivedi", "2015-10-05", "Male", "Pankaj Trivedi", "9891234529", "Sukhdev Vihar", "New Delhi", centreSukhdev, batch1, coach1, iso(-30), "Weekday Batch", 2500, 1500, "ACTIVE", null],
  ["Naisha Dutta", "2017-01-27", "Female", "Arindam Dutta", "9891234530", "GK-1", "New Delhi", centreGK, batch3, coach2, iso(-28), "Weekend Batch", 2500, 1500, "ACTIVE", null],
  ["Reyansh Bajaj", "2016-09-09", "Male", "Vivek Bajaj", "9891234531", "DLF Phase 2", "Gurugram", centreDLF, batch4, coach3, iso(-25), "Weekday Batch", 2200, 1500, "ACTIVE", null],
  ["Aadhya Sethi", "2018-05-22", "Female", "Rakesh Sethi", "9891234532", "Sukhdev Vihar", "New Delhi", centreSukhdev, batch2, coach4, iso(-22), "Weekend Batch", 2500, 1500, "ACTIVE", null],
  ["Aarav Sharma Jr", "2019-03-03", "Male", "Deepak Sharma", "9891234533", "GK-1", "New Delhi", centreGK, batch3, coach2, iso(-19), "Weekend Batch", 2500, 1500, "ACTIVE", null],
  ["Ridhima Sood", "2017-11-11", "Female", "Alok Sood", "9891234534", "DLF Phase 2", "Gurugram", centreDLF, batch4, coach3, iso(-14), "Weekday Batch", 2200, 1500, "ACTIVE", null],
  ["Shaurya Bhalla", "2016-04-04", "Male", "Manish Bhalla", "9891234535", "Sukhdev Vihar", "New Delhi", centreSukhdev, batch1, coach1, iso(-10), "Weekday Batch", 2500, 1500, "ACTIVE", null],
  ["Myra Kohli", "2018-07-07", "Female", "Sunny Kohli", "9891234536", "GK-1", "New Delhi", centreGK, batch3, coach2, iso(-5), "Weekend Batch", 2500, 1500, "TRIAL", null],
  ["Vivaan Gupta Sr", "2015-02-28", "Male", "Ramesh Gupta", "9891234537", "DLF Phase 2", "Gurugram", centreDLF, batch4, coach3, iso(-100), "Weekday Batch", 2200, 1500, "LEFT_ACADEMY", null],
];

const playerIds = playerSeed.map((row) => insertPlayer(...row));

// ---------- Payments (fee tracking) ----------
function insertPayment(playerId, amount, forMonth, dueDate, paymentDate, method, status, addedBy) {
  const payId = id();
  const code = nextCode("PAY");
  db.prepare(
    `INSERT INTO payments (id, code, player_id, amount, for_month, due_date, payment_date, payment_method, status, added_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(payId, code, playerId, amount, forMonth, dueDate, paymentDate, method, status, addedBy);
}

const monthLabel = (offset) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() + offset, 1);
  return d.toISOString().slice(0, 7);
};

// Most players paid this month; a handful pending/overdue/partial for realism
playerIds.forEach((pid, idx) => {
  const fee = playerSeed[idx][12];
  if (playerSeed[idx][14] === "LEFT_ACADEMY") return;
  if (idx % 5 === 0) {
    // pending - no payment recorded this month
    return;
  }
  if (idx % 7 === 0) {
    // partially paid
    insertPayment(pid, Math.round(fee / 2), monthLabel(0), iso(5), iso(-2), "UPI", "PARTIALLY_PAID", emp1Id);
  } else {
    insertPayment(pid, fee, monthLabel(0), iso(5), iso(-3), idx % 2 === 0 ? "UPI" : "CASH", "PAID", idx % 2 === 0 ? emp1Id : emp2Id);
  }
});

// Recalculate payment status per player (mirrors app logic)
for (const pid of playerIds) {
  const player = db.prepare(`SELECT * FROM players WHERE id = ?`).get(pid);
  const paidRow = db
    .prepare(`SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE player_id = ? AND status IN ('PAID','PARTIALLY_PAID')`)
    .get(pid);
  const paid = paidRow.total;
  let status;
  if (paid <= 0) status = "PENDING";
  else if (paid < player.monthly_fee) status = "PARTIALLY_PAID";
  else status = "PAID";
  db.prepare(`UPDATE players SET payment_status = ? WHERE id = ?`).run(status, pid);
}

// ---------- Finance transactions ----------
function insertTxn(date, type, category, description, amount, method, centreId, playerId, addedBy) {
  const tid = id();
  const code = nextCode("TXN");
  db.prepare(
    `INSERT INTO transactions (id, code, date, type, category, description, amount, payment_method, related_player_id, related_centre_id, added_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(tid, code, date, type, category, description, amount, method, playerId, centreId, addedBy);
}

// Revenue mirrors payments collected
db.prepare(`SELECT * FROM payments`).all().forEach((p) => {
  const player = db.prepare(`SELECT * FROM players WHERE id = ?`).get(p.player_id);
  insertTxn(p.payment_date || p.for_month + "-05", "REVENUE", "Monthly Fees", `Fee collected from ${player.name}`, p.amount, p.payment_method, player.centre_id, player.id, p.added_by_user_id);
});

// Registration fee revenue for a few recently joined players
playerIds.slice(0, 6).forEach((pid) => {
  const player = db.prepare(`SELECT * FROM players WHERE id = ?`).get(pid);
  insertTxn(player.joining_date, "REVENUE", "Registration Fees", `Registration fee - ${player.name}`, player.registration_fee, "UPI", player.centre_id, player.id, ownerId);
});

// Expenses over the last 3 months
const expenseSeed = [
  [iso(-2), "Coach Payments", "Monthly coach salaries", 100000, "BANK_TRANSFER", centreSukhdev],
  [iso(-5), "Ground/Pitch Expenses", "Ground rental - Sukhdev Vihar", 15000, "CASH", centreSukhdev],
  [iso(-8), "Equipment", "New footballs and cones", 8000, "UPI", centreGK],
  [iso(-11), "Marketing", "Instagram ad campaign", 5000, "ONLINE_PAYMENT", null],
  [iso(-15), "Travel", "Coach travel for GK centre", 3000, "CASH", centreGK],
  [iso(-20), "Ground/Pitch Expenses", "Ground rental - DLF Phase 2", 18000, "BANK_TRANSFER", centreDLF],
  [iso(-25), "Office Expenses", "Printing & stationery", 2000, "CASH", null],
  [iso(-40), "Coach Payments", "Monthly coach salaries", 98000, "BANK_TRANSFER", centreSukhdev],
  [iso(-45), "Equipment", "Training bibs and cones", 6000, "UPI", centreDLF],
  [iso(-60), "Marketing", "Flyers for GK society", 3000, "CASH", centreGK],
];
expenseSeed.forEach(([date, category, desc, amount, method, centreId]) => {
  insertTxn(date, "EXPENSE", category, desc, amount, method, centreId, null, ownerId);
});

// ---------- Activity log (seed history) ----------
function logActivity(userId, userName, action, module, recordId, recordLabel, description) {
  db.prepare(
    `INSERT INTO activity_logs (id, user_id, user_name, action, module, record_id, record_label, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id(), userId, userName, action, module, recordId, recordLabel, description);
}

logActivity(ownerId, "Vaibhav Sahrawat", "System Setup", "System", null, null, "Athaya Football Academy ERP initialized with sample data.");
logActivity(adminId, "Priya Menon", "Created", "Coaches", coach1, "Arjun Mehta", "Added new coach Arjun Mehta to Sukhdev Vihar centre.");
logActivity(emp1Id, "Rahul Verma", "Status Changed", "Leads", leadIds[0], "Aarav Sharma", "Lead status changed from Trial Completed to Converted.");
logActivity(emp1Id, "Rahul Verma", "Created", "Players", playerIds[0], "Aarav Sharma", "Player profile created after lead conversion.");
logActivity(emp2Id, "Sneha Kapoor", "Payment Recorded", "Finance", playerIds[1], "Vivaan Gupta", "Recorded monthly fee payment of ₹2,500 via UPI.");

// Flush WAL contents into the main db file and close cleanly so any other
// process opening this file immediately afterward sees the full dataset.
db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
db.close();

console.log("Seed complete.");
console.log("");
console.log("Login credentials:");
console.log(`  Super Admin: owner@athayafootball.com / ${ownerPassword}`);
console.log(`  Admin:       admin@athayafootball.com / ${adminPassword}`);
console.log(`  Employee:    rahul@athayafootball.com / ${employeePassword}`);
console.log(`  Employee:    sneha@athayafootball.com / ${employeePassword}`);
