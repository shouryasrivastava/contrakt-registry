import { expect, test } from "@playwright/test";
import { readE2EState } from "./support/state";

test("landing navigation has no Marketplace item", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Contrakt home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Marketplace" })).toHaveCount(0);
  if (testInfo.project.name.includes("desktop")) {
    await expect(page.getByRole("link", { name: "Registry", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Documentation", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "My APIs", exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole("link", { name: "Explore Registry" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Publish Your API" })).toBeVisible();
  }
});

test("registry search, stack filters, sorting, and contract links work", async ({
  page,
}) => {
  const state = readE2EState();
  await page.goto(`/registry?q=${encodeURIComponent(state.appName)}`);
  await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(state.appName)}`));
  await expect(page.getByText(state.slug, { exact: true }).first()).toBeVisible();
  const nextjsFilter = page.getByRole("button", { name: "nextjs-app-router" });
  await nextjsFilter.scrollIntoViewIfNeeded();
  await page.goto(
    `/registry?q=${encodeURIComponent(state.appName)}&stack=nextjs-app-router`,
  );
  await expect(page).toHaveURL(/stack=nextjs-app-router/);
  await page.goto(
    `/registry?q=${encodeURIComponent(state.appName)}&stack=nextjs-app-router&sort=earned`,
  );
  await expect(page).toHaveURL(/sort=earned/);
  await page.getByRole("link", { name: /Open contract/ }).click();
  await expect(page).toHaveURL(new RegExp(`/u/${state.slug}$`));
});

test("registry and health endpoints load without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/registry");
  await expect(page.getByRole("heading", { name: "Public Registry" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Marketplace" })).toHaveCount(0);
  expect(errors).toEqual([]);

  const health = await page.request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  await expect(health.json()).resolves.toMatchObject({ status: "ok" });

  const landing = await page.request.get("/");
  expect(landing.headers()["content-security-policy"]).toContain("default-src 'self'");
  expect(landing.headers()["x-content-type-options"]).toBe("nosniff");
});
