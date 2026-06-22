import { expect, test } from "@playwright/test";

test("wallet chooser and injected-wallet connection persist", async ({ page }) => {
  const address = "0x3333333333333333333333333333333333333333";
  await page.addInitScript(
    ({ testAddress, signature }) => {
      const provider = {
        isMetaMask: true,
        async request({ method }: { method: string }) {
          if (method === "eth_requestAccounts" || method === "eth_accounts") {
            return [testAddress];
          }
          if (method === "eth_chainId") return "0x14a34";
          if (method === "personal_sign") return signature;
          throw new Error(`Unsupported E2E wallet method: ${method}`);
        },
      };
      Object.defineProperty(window, "ethereum", {
        configurable: true,
        value: provider,
      });
    },
    { testAddress: address, signature: `0x${"e".repeat(130)}` },
  );
  await page.goto("/dashboard/settings");
  await page.locator("[data-connect-wallet]").last().click();
  await expect(page.getByRole("heading", { name: "How do you want to connect?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "How do you want to connect?" })).toHaveCount(0);

  await page.locator("[data-connect-wallet]").last().click();
  await page.getByText("Connect existing wallet", { exact: true }).click();
  await expect(page.locator("[data-connect-wallet]").last()).toContainText("Wallet");
  await page.reload();
  await page.locator("[data-connect-wallet]").last().click();
  await expect(page.getByText(address)).toBeVisible();
  await expect(page.getByText(address)).toBeVisible();
});

test("embedded-wallet OTP errors are readable and success is explicit", async ({
  page,
  request,
}) => {
  await request.delete("/api/wallet");
  await page.goto("/dashboard/settings");
  await page.locator("[data-connect-wallet]").last().click();
  await page.getByText("Create instant wallet", { exact: true }).click();
  await page.getByLabel("Email").fill("owner@example.test");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Verification code").fill("000000");
  await page.getByRole("button", { name: "Create wallet" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("Incorrect code");
  await page.getByLabel("Verification code").fill("123456");
  await page.getByRole("button", { name: "Create wallet" }).click();
  await expect(page.locator("[data-connect-wallet]").last()).toContainText("Wallet");
  await page.locator("[data-connect-wallet]").last().click();
  await expect(page.getByText("Contrakt embedded wallet")).toBeVisible();
});
