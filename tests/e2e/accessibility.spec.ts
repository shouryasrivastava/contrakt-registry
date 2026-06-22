import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readE2EState } from "./support/state";

for (const route of ["/dashboard", "/dashboard/settings"] as const) {
  test(`owner page ${route} has no serious accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    expect(
      results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
  });
}

test("API workspace has no serious accessibility violations", async ({ page }) => {
  const state = readE2EState();
  await page.goto(`/u/${state.slug}/dashboard`);
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  expect(
    results.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
});
