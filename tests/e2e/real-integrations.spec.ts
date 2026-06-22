import { expect, test } from "@playwright/test";
import { createWalletClient, http, parseAbi, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { e2eHeaders, readE2EState } from "./support/state";

test.describe("real staging integrations", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "owner-desktop", "Run real providers once.");
  });
  test.skip(
    process.env.REAL_PROVIDER_SMOKE !== "true",
    "Enable only in nightly or manual release workflows.",
  );

  test("Upstash Redis enforces and expires a real rate limit", async ({
    request,
  }) => {
    const state = readE2EState();
    const url = `/api/e2e/rate-limit?runId=${state.runId}`;
    expect((await request.get(url, { headers: e2eHeaders() })).status()).toBe(200);
    expect((await request.get(url, { headers: e2eHeaders() })).status()).toBe(200);
    expect((await request.get(url, { headers: e2eHeaders() })).status()).toBe(429);
    await new Promise((resolve) => setTimeout(resolve, 2600));
    expect((await request.get(url, { headers: e2eHeaders() })).status()).toBe(200);
  });

  test("QStash delivers a signed contract update", async ({ request }) => {
    const state = readE2EState();
    const baseURL =
      process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
    const webhookUrl = `${baseURL}/api/e2e/webhook-receiver?key=${encodeURIComponent(
      process.env.E2E_AUTH_SECRET ?? "",
    )}`;
    const hook = await request.post(
      `/api/registry/contracts/${state.slug}/webhooks`,
      {
        headers: { authorization: `Bearer ${state.token}` },
        data: { url: webhookUrl, secret: `secret-${state.runId}` },
      },
    );
    expect(hook.status()).toBe(201);

    const contractResponse = await request.get(
      `/api/registry/contracts/${state.slug}`,
    );
    const current = await contractResponse.json();
    const publish = await request.post("/api/contracts", {
      headers: { authorization: `Bearer ${state.token}` },
      data: {
        name: state.appName,
        contract: {
          ...current.contract,
          generatedAt: new Date().toISOString(),
        },
      },
    });
    expect(publish.ok()).toBeTruthy();

    await expect
      .poll(
        async () => {
          const response = await request.get(
            `/api/registry/contracts/${state.slug}/webhooks`,
            { headers: { authorization: `Bearer ${state.token}` } },
          );
          const payload = await response.json();
          return payload.deliveries?.[0]?.status;
        },
        { timeout: 30_000 },
      )
      .toBe("delivered");
  });

  test("Sentry accepts a tagged staging event", async ({ request }) => {
    const state = readE2EState();
    const response = await request.post("/api/e2e/sentry", {
      headers: e2eHeaders(),
      data: { runId: state.runId },
    });
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).eventId).toMatch(/^[a-f0-9]{32}$/);
  });

  test("Onramper returns a signed widget URL", async ({ request }) => {
    const state = readE2EState();
    await request.patch("/api/e2e/wallet", {
      headers: e2eHeaders(),
      data: { runId: state.runId },
    });
    const response = await request.get(
      "/api/onramp?address=0x1111111111111111111111111111111111111111",
    );
    const payload = await response.json();
    expect(response.ok()).toBeTruthy();
    expect(payload.configured).toBe(true);
    expect(payload.url).toContain("buy.onramper.com");
    expect(payload.url).toContain("signature=");
  });

  test("Coinbase wallet UI initializes without browser errors", async ({
    page,
  }) => {
    test.skip(
      !process.env.NEXT_PUBLIC_CDP_PROJECT_ID ||
        process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true",
      "Real Coinbase UI requires a provider-enabled deployment without the deterministic adapter.",
    );
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/dashboard/settings");
    await page.locator("[data-connect-wallet]").last().click();
    await page.getByText("Create instant wallet", { exact: true }).click();
    await expect(page.getByText("Secured by Coinbase")).toBeVisible();
    expect(errors.filter((error) => /coinbase|cdp/i.test(error))).toEqual([]);
  });

  test("Base Sepolia USDC receipt verifies and rejects replay", async ({
    request,
  }) => {
    const privateKey = process.env.E2E_SEPOLIA_PRIVATE_KEY as
      | `0x${string}`
      | undefined;
    test.skip(!privateKey, "No funded Base Sepolia test wallet configured.");
    const state = readE2EState();
    const receiver = process.env.E2E_SEPOLIA_RECEIVER as
      | `0x${string}`
      | undefined;
    const usdc = process.env.X402_USDC_ADDRESS as `0x${string}` | undefined;
    test.skip(!receiver || !usdc, "Sepolia receiver or USDC address missing.");

    const config = await request.put(
      `/api/registry/contracts/${state.slug}/monetization`,
      {
        headers: { authorization: `Bearer ${state.token}` },
        data: {
          receiverAddress: receiver,
          priceUsd: "0.001",
          freeTierCalls: 0,
          enabled: true,
        },
      },
    );
    expect(config.ok()).toBeTruthy();

    const account = privateKeyToAccount(privateKey!);
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(process.env.X402_RPC_URL),
    });
    const abi = parseAbi(["function transfer(address to, uint256 value) returns (bool)"]);
    const hash = await client.writeContract({
      address: usdc!,
      abi,
      functionName: "transfer",
      args: [receiver!, parseUnits("0.001", 6)],
    });

    await new Promise((resolve) => setTimeout(resolve, 12_000));
    const verify = await request.post(
      `/api/registry/contracts/${state.slug}/payments`,
      { data: { txHash: hash, agentId: `e2e-${state.runId}` } },
    );
    expect(verify.ok()).toBeTruthy();
    const replay = await request.post(
      `/api/registry/contracts/${state.slug}/payments`,
      { data: { txHash: hash, agentId: `other-${state.runId}` } },
    );
    expect(replay.status()).toBe(409);
  });
});
