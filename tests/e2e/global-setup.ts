import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, request, type FullConfig } from "@playwright/test";
import {
  consumerAuthFile,
  e2eHeaders,
  ownerAuthFile,
  stateDir,
  stateFile,
  type E2EState,
} from "./support/state";

async function saveSession(
  baseURL: string,
  username: string,
  output: string,
) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto("/sign-in?next=%2Fdashboard");
  await page.getByLabel("E2E username").fill(username);
  await page
    .getByLabel("E2E secret")
    .fill(process.env.E2E_AUTH_SECRET ?? "contrakt-e2e-local-secret");
  await page.getByRole("button", { name: "Sign in for E2E" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
    timeout: 90_000,
    waitUntil: "domcontentloaded",
  });

  const sessionResponse = await context.request.get("/api/auth/session");
  const session = (await sessionResponse.json()) as {
    user?: { id?: string; username?: string };
  };
  if (!session.user?.id || session.user.username !== username) {
    throw new Error(`E2E authentication failed for ${username}.`);
  }
  await context.storageState({ path: output });
  await browser.close();
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = String(
    config.projects[0]?.use?.baseURL ?? "http://127.0.0.1:3000",
  );
  const runId =
    process.env.E2E_RUN_ID ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  mkdirSync(stateDir, { recursive: true });
  const api = await request.newContext({ baseURL });
  const response = await api.post("/api/e2e/setup", {
    headers: e2eHeaders(),
    data: { runId },
  });
  if (!response.ok()) {
    throw new Error(
      `E2E fixture setup failed (${response.status()}): ${await response.text()}`,
    );
  }
  const state = (await response.json()) as E2EState;
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  await api.dispose();

  await saveSession(baseURL, state.owner, ownerAuthFile);
  await saveSession(baseURL, state.consumer, consumerAuthFile);
}
