import { expect, test } from "@playwright/test";
import { readE2EState } from "./support/state";

test("owner console remains navigable on mobile", async ({ page }) => {
  const state = readE2EState();

  for (const [path, heading] of [
    ["/dashboard", "My APIs"],
    ["/dashboard/settings", "Settings"],
    [`/u/${state.slug}/dashboard`, state.appName],
    [`/u/${state.slug}/dashboard/integrations`, "Integrations"],
    [`/u/${state.slug}/dashboard/monetization`, "Monetization"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  }
});
