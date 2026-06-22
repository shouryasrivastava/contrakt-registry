import { existsSync } from "node:fs";
import { request, type FullConfig } from "@playwright/test";
import { e2eHeaders, readE2EState, stateFile } from "./support/state";

export default async function globalTeardown(config: FullConfig) {
  if (!existsSync(stateFile)) return;
  const baseURL = String(
    config.projects[0]?.use?.baseURL ?? "http://127.0.0.1:3000",
  );
  const state = readE2EState();
  const api = await request.newContext({ baseURL });
  const response = await api.post("/api/e2e/cleanup", {
    headers: e2eHeaders(),
    data: { runId: state.runId },
  });
  await api.dispose();
  if (!response.ok()) {
    throw new Error(
      `E2E fixture cleanup failed (${response.status()}): ${await response.text()}`,
    );
  }
}
