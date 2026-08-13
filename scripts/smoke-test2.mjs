import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:3002";
const results = [];
function log(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${detail ? " — " + detail : ""}`);
}

const browser = await chromium.launch();

async function login(page, email, password) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector("text=Active Players", { timeout: 15000 });
}

try {
  const context = await browser.newContext();
  const page = await context.newPage();

  await login(page, "owner@athayafootball.com", "Athaya@123");

  // CSV export downloads
  for (const url of [
    "/api/export/leads",
    "/api/export/players",
    "/api/export/finance",
    "/api/export/activity",
    "/api/export/reports/players?format=csv",
    "/api/export/reports/players?format=xlsx",
  ]) {
    const resp = await page.request.get(`${BASE}${url}`);
    log(`Export ${url}`, resp.ok(), `status ${resp.status()}, content-type ${resp.headers()["content-type"]}`);
  }

  // Convert a lead to a player
  await page.goto(`${BASE}/leads?status=NEW`);
  // find a non-converted lead row and open it via its href (more robust than clicking a live row)
  const rows = page.locator("table tbody tr");
  const count = await rows.count();
  let opened = false;
  for (let i = 0; i < count; i++) {
    const text = await rows.nth(i).innerText();
    if (!text.includes("CONVERTED") && !text.includes("LOST") && !text.includes("NOT INTERESTED")) {
      const href = await rows.nth(i).locator("a").first().getAttribute("href");
      if (href) {
        await page.goto(`${BASE}${href}`);
        opened = true;
        break;
      }
    }
  }
  if (opened) {
    const convertBtn = page.getByRole("button", { name: "Convert to Player" });
    if (await convertBtn.isVisible()) {
      await convertBtn.click();
      await page.waitForSelector("text=Fee Details", { timeout: 15000 });
      log("Convert lead to player", true, page.url());
    } else {
      log("Convert lead to player", false, "button not visible (maybe already converted)");
    }
  } else {
    log("Convert lead to player", false, "no convertible lead row found");
  }

  // Import wizard: upload a small CSV of leads
  const csvPath = "/tmp/sample_leads_import.csv";
  fs.writeFileSync(
    csvPath,
    "Child Name,Parent Name,Phone,Location,Source\nImport Test Child,Import Test Parent,9123456780,Sukhdev Vihar,Referral\n"
  );
  await page.goto(`${BASE}/import`);
  await page.selectOption("#module", "leads");
  await page.setInputFiles("#file", csvPath);
  await page.click('button:has-text("Upload & Preview")');
  await page.waitForSelector("text=Map Columns to ERP Fields", { timeout: 15000 });
  log("Import: file parsed and mapping UI shown", true);

  await page.click('button:has-text("Confirm Import")');
  await page.waitForSelector("text=Import completed.", { timeout: 15000 });
  const summaryText = await page.locator("text=Imported").first().innerText().catch(() => "");
  log("Import: commit succeeded", true, summaryText);

  await page.goto(`${BASE}/leads?search=Import Test Child`);
  const imported = await page.isVisible("text=Import Test Child");
  log("Imported lead visible in Leads list", imported);

  await context.close();

  // Employee role permission check
  const empContext = await browser.newContext();
  const empPage = await empContext.newPage();
  await login(empPage, "rahul@athayafootball.com", "Athaya@123");

  const sidebarText = await empPage.locator("aside nav").innerText();
  const hasFinance = sidebarText.includes("Finance");
  const hasUsers = sidebarText.includes("Users");
  log("Employee sidebar hides Finance module", !hasFinance, sidebarText.replace(/\n/g, " | "));
  log("Employee sidebar hides Users module", !hasUsers);

  await empPage.goto(`${BASE}/finance`);
  const forbiddenVisible = await empPage.isVisible("text=You do not have permission");
  log("Employee blocked from Finance page directly", forbiddenVisible);

  await empContext.close();
} catch (err) {
  log("Unexpected error", false, String(err));
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length > 0 ? 1 : 0);
