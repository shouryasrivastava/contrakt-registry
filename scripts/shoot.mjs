// Capture full-page screenshots of every registry page in dark + light.
// Saves PNGs to ./screenshots/. Run while `pnpm dev` is up on :3000.
//   node scripts/shoot.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });

const pages = [
  { name: "home", path: "/" },
  { name: "dashboard", path: "/dashboard" },
  { name: "contract", path: "/c/shouryasrivastava/contrakt-registry" },
  { name: "earnings", path: "/u/shouryasrivastava/contrakt-registry/earnings" },
];

const browser = await chromium.launch();

for (const theme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // crisp retina output
  });
  // Seed the theme before any page script runs (matches the no-FOUC script).
  await ctx.addInitScript((t) => {
    try { localStorage.setItem("theme", t); } catch {}
  }, theme);

  const page = await ctx.newPage();

  for (const p of pages) {
    let ok = false;
    // retry past the flaky Neon DNS blips
    for (let i = 0; i < 10 && !ok; i++) {
      const res = await page.goto(BASE + p.path, { waitUntil: "networkidle", timeout: 20000 }).catch(() => null);
      if (res && res.status() === 200) ok = true;
      else await page.waitForTimeout(1500);
    }
    await page.waitForTimeout(600); // let fonts/animations settle
    const file = `${OUT}/${p.name}-${theme}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`${ok ? "✓" : "⚠"} ${file}`);
  }
  await ctx.close();
}

await browser.close();
console.log("\nDone → ./screenshots/");
