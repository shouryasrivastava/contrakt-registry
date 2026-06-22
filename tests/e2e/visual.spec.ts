import { expect, test } from "@playwright/test";
import { readE2EState } from "./support/state";

test.use({
  colorScheme: "light",
});

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
});

for (const [name, path] of [
  ["my-apis", "/dashboard"],
  ["settings", "/dashboard/settings"],
] as const) {
  test(`${name} visual baseline`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      animations: "disabled",
      mask: [page.locator("time"), page.locator("[data-dynamic]")],
    });
  });
}

for (const [name, suffix] of [
  ["api-overview", ""],
  ["integrations", "/integrations"],
  ["monetization", "/monetization"],
] as const) {
  test(`${name} visual baseline`, async ({ page }) => {
    const state = readE2EState();
    await page.goto(`/u/${state.slug}/dashboard${suffix}`);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      animations: "disabled",
      mask: [page.locator("time"), page.locator("[data-dynamic]")],
    });
  });
}

test("wallet chooser visual baseline", async ({ page }) => {
  await page.goto("/dashboard/settings");
  await page.locator("[data-connect-wallet]").last().click();
  await expect(page.getByRole("heading", { name: "How do you want to connect?" })).toBeVisible();
  await expect(page).toHaveScreenshot("wallet-chooser.png", {
    fullPage: true,
    animations: "disabled",
  });
});
