import { expect, test } from "@playwright/test";

test("production domains, health, readiness, and OAuth redirect are healthy", async ({
  page,
  request,
}) => {
  const site = process.env.PRODUCTION_SITE_URL ?? "https://contrakt.dev";
  const registry =
    process.env.PRODUCTION_REGISTRY_URL ?? "https://registry.contrakt.dev";

  const landing = await request.get(site);
  expect(landing.ok()).toBeTruthy();
  expect(landing.url()).toMatch(/^https:\/\/(www\.)?contrakt\.dev\/$/);

  const health = await request.get(`${registry}/api/health`);
  expect(health.ok()).toBeTruthy();
  await expect(health.json()).resolves.toMatchObject({ status: "ok" });
  const ready = await request.get(`${registry}/api/ready`);
  expect(ready.ok()).toBeTruthy();
  await expect(ready.json()).resolves.toMatchObject({ status: "ready" });

  await page.goto(`${registry}/dashboard`);
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/);
  await expect(page.getByRole("button", { name: /Continue with GitHub/ })).toBeVisible();
  const auth = await request.get(`${registry}/api/auth/signin/github`, {
    maxRedirects: 0,
  });
  expect([302, 303, 307]).toContain(auth.status());
});
