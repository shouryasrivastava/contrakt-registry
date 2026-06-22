import { expect, test } from "@playwright/test";
import { readE2EState } from "./support/state";

test("owner portfolio and publish onboarding work", async ({ page }) => {
  const state = readE2EState();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "My APIs" })).toBeVisible();
  await expect(page.getByRole("link", { name: state.appName })).toBeVisible();
  await page.getByRole("main").getByRole("button", { name: "Publish API" }).click();
  await expect(page.getByRole("heading", { name: "Add an API to Contrakt" })).toBeVisible();
  await expect(page.getByText("contrakt init", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("heading", { name: "Add an API to Contrakt" })).toHaveCount(0);
});

test("token lifecycle and clipboard feedback work", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/dashboard/settings");
  const created = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/tokens") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create token" }).click();
  expect((await created).ok()).toBeTruthy();
  await expect(page.getByText("Token created")).toBeVisible();
  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
  const revoke = page.getByRole("button", { name: "Revoke" }).last();
  await revoke.click();
  await expect(page.getByText(/Token revocation failed/)).toHaveCount(0);
});

test("owner navigation responds on first click and sign-out can be cancelled", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings$/);
  await page.getByRole("button", { name: "Open account menu" }).click();
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Disconnect GitHub" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
