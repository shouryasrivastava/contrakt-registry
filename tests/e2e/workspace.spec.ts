import { expect, test } from "@playwright/test";
import { e2eHeaders, readE2EState } from "./support/state";

test("workspace overview and every sidebar destination work", async ({ page }) => {
  const state = readE2EState();
  await page.goto(`/u/${state.slug}/dashboard`);
  await expect(page.getByText(state.appName, { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("complementary").getByText("2 endpoints"),
  ).toBeVisible();

  for (const [label, path] of [
    ["Consumers", "consumers"],
    ["Monetization · Beta", "monetization"],
    ["Integrations", "integrations"],
  ] as const) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/${path}$`));
    await page.getByRole("link", { name: "Overview" }).click();
    await expect(page).toHaveURL(new RegExp(`/u/${state.slug}/dashboard$`));
  }
});

test("deployment validation, simulation, persistence, copy, and webhooks work", async ({
  page,
  context,
}) => {
  const state = readE2EState();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`/u/${state.slug}/dashboard/integrations`);
  const baseUrl = page.getByLabel("Base URL");

  await baseUrl.fill("http://example.com");
  await expect(page.getByText(/must use HTTPS/)).toBeVisible();

  await baseUrl.fill("https://reachable.e2e.test");
  await page.getByRole("button", { name: "Test connection" }).click();
  await expect(page.getByRole("status")).toContainText("HTTP 200");
  await page.getByRole("button", { name: "Save URL" }).click();
  await expect(page.getByRole("status")).toContainText("Deployment URL saved");

  await page.getByRole("button", { name: "Copy" }).first().click();
  await expect(page.getByTitle("Copy")).toHaveCount(4);

  const webhookInput = page.getByPlaceholder("https://example.com/hooks/contrakt");
  await webhookInput.fill("not-a-url");
  await page.getByRole("button", { name: "Add webhook" }).click();
  await expect(page.getByText(/complete webhook URL/i)).toBeVisible();
  await webhookInput.fill("https://reachable.e2e.test/hook");
  await page.getByRole("button", { name: "Add webhook" }).click();
  await expect(page.getByText("Webhook added")).toBeVisible();
  await expect(page.getByText("https://reachable.e2e.test/hook")).toBeVisible();
  await page.getByRole("button", { name: "Remove webhook" }).click();
  await expect(page.getByText("Webhook removed")).toBeVisible();
});

test("wallet-backed monetization persists and receipts render", async ({
  page,
  request,
}) => {
  const state = readE2EState();
  const address = "0x1111111111111111111111111111111111111111";
  const wallet = await request.patch("/api/e2e/wallet", {
    headers: e2eHeaders(),
    data: { runId: state.runId, address },
  });
  expect(wallet.ok()).toBeTruthy();

  await page.goto(`/u/${state.slug}/dashboard/monetization`);
  await expect(page.getByText("Connected wallet is the payout receiver.")).toBeVisible();
  await page.getByLabel("Receiver wallet").fill(address);
  await page.getByLabel("Price per call (USDC)").fill("0.002");
  await page.getByLabel("Free calls per agent").fill("5");
  await page.getByLabel("Accept paid calls").check();
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith(
        `/api/registry/contracts/${state.slug}/monetization`,
      ) && response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save pricing" }).click();
  expect((await saved).ok()).toBeTruthy();
  await expect(page.getByText(/Could not save|could not reach/)).toHaveCount(0);

  const receipt = await request.patch("/api/e2e/receipt", {
    headers: e2eHeaders(),
    data: { runId: state.runId, slug: state.slug },
  });
  expect(receipt.ok()).toBeTruthy();
  await page.reload();
  await expect(page.getByText(`e2e-agent-${state.runId}`)).toBeVisible();
});
