import { expect, test } from "@playwright/test";
import { readE2EState } from "./support/state";

test("protected routes preserve the destination through sign-in", async ({
  page,
}) => {
  const state = readE2EState();
  await page.goto(`/u/${state.slug}/dashboard/integrations`);
  await page.waitForURL(/\/sign-in\?next=/, {
    timeout: 30_000,
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { name: "Sign in to manage this contract." }),
  ).toBeVisible();
  await expect(page.getByText(`/u/${state.slug}/dashboard/integrations`)).toBeVisible();
});

test("public endpoints, redirects, metadata, and error pages are healthy", async ({
  page,
  request,
}) => {
  const state = readE2EState();
  const checks = [
    ["/api/health", 200],
    ["/api/ready", 200],
    [`/api/registry/contracts/${state.slug}`, 200],
    [
      `/api/registry/contracts/${state.slug}/mcp?base_url=https%3A%2F%2Fapi.example.com`,
      200,
    ],
    [`/badge/${state.slug}`, 200],
    ["/llms.txt", 200],
    ["/mcp", 200],
  ] as const;
  for (const [url, status] of checks) {
    const response = await request.get(url);
    expect(response.status(), url).toBe(status);
  }

  const legacy = await request.get(`/c/${state.slug}`, { maxRedirects: 0 });
  expect([307, 308]).toContain(legacy.status());
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: /does not exist/i })).toBeVisible();
});
