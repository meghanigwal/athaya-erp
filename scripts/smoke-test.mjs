import { chromium } from "playwright";

const BASE = "http://localhost:3002";
const results = [];

function log(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${detail ? " — " + detail : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  // 1. Login page loads
  await page.goto(`${BASE}/login`);
  await page.waitForSelector("text=Athaya Football Academy");
  log("Login page renders", true);

  // 2. Login as Super Admin
  await page.fill('input[name="email"]', "owner@athayafootball.com");
  await page.fill('input[name="password"]', "Athaya@123");
  await page.click('button[type="submit"]');
  await page.waitForSelector("text=Active Players", { timeout: 15000 });
  log("Login redirects to dashboard", page.url().includes("/dashboard"), page.url());
  log("Dashboard KPI cards render", true);

  // 3. Leads page + add lead
  await page.goto(`${BASE}/leads`);
  await page.waitForSelector("text=Leads & Sales");
  log("Leads list page renders", true);

  await page.goto(`${BASE}/leads/new`);
  await page.fill('#child_name', "Test Child Smoke");
  await page.fill('#parent_name', "Test Parent Smoke");
  await page.fill('#phone', "9999999999");
  await page.click('button[type="submit"]');
  await page.waitForSelector("text=Test Child Smoke", { timeout: 15000 });
  const leadVisible = await page.isVisible("text=Test Child Smoke");
  log("Create lead + redirect to list", leadVisible);

  // 4. Players page
  await page.goto(`${BASE}/players`);
  await page.waitForSelector("text=Players");
  const playerRowCount = await page.locator("table tbody tr").count();
  log("Players list renders with seeded data", playerRowCount > 0, `${playerRowCount} rows`);

  // Open first player profile & record a payment
  await page.locator("table tbody tr td a").first().click();
  await page.waitForSelector("text=Fee Details");
  log("Player profile page renders", true);

  const recordPaymentBtn = page.getByRole("button", { name: "Record Payment" });
  if (await recordPaymentBtn.isVisible()) {
    await recordPaymentBtn.click();
    await page.fill('#amount', "2500");
    await page.click('button:has-text("Save Payment")');
    await page.waitForSelector("text=Payment History", { timeout: 10000 });
    log("Record payment flow works", true);
  } else {
    log("Record payment flow works", false, "button not visible");
  }

  // 5. Coaches
  await page.goto(`${BASE}/coaches`);
  await page.waitForSelector("text=Coaches & Staff");
  log("Coaches page renders", true);

  // 6. Centres
  await page.goto(`${BASE}/centres`);
  await page.waitForSelector("text=Centres & Batches");
  log("Centres & Batches page renders", true);

  // 7. Finance
  await page.goto(`${BASE}/finance`);
  await page.waitForSelector("text=Finance & Accounts");
  log("Finance page renders", true);

  // 8. Reports
  await page.goto(`${BASE}/reports`);
  await page.waitForSelector("text=Reports");
  const reportRows = await page.locator("table tbody tr").count();
  log("Reports page renders with data", reportRows > 0, `${reportRows} rows`);

  // 9. Import Centre
  await page.goto(`${BASE}/import`);
  await page.waitForSelector("text=Data Import Centre");
  log("Import Centre page renders", true);

  // 10. Activity Log
  await page.goto(`${BASE}/activity`);
  await page.waitForSelector("text=Activity Log");
  const activityRows = await page.locator("table tbody tr").count();
  log("Activity log renders with entries", activityRows > 0, `${activityRows} rows`);

  // 11. Users & Permissions
  await page.goto(`${BASE}/users`);
  await page.waitForSelector("text=Users & Permissions");
  log("Users page renders", true);

  await page.goto(`${BASE}/users`);
  const manageLinks = page.locator('a:has-text("Manage")');
  await manageLinks.nth(1).click(); // manage a non-super-admin user
  await page.waitForSelector("text=Module Permissions");
  log("User permission matrix renders", true);

  // 12. Settings
  await page.goto(`${BASE}/settings`);
  await page.waitForSelector("text=Change Password");
  log("Settings page renders", true);

  // 13. Logout
  await page.goto(`${BASE}/dashboard`);
  await page.click('button:has(svg) >> nth=-1'); // fallback, try user menu
} catch (err) {
  log("Unexpected error during smoke test", false, String(err));
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length > 0 ? 1 : 0);
