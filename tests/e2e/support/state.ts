import { readFileSync } from "node:fs";
import { join } from "node:path";

export type E2EState = {
  runId: string;
  owner: string;
  consumer: string;
  ownerId: string;
  consumerId: string;
  slug: string;
  appName: string;
  token: string;
  consumerToken: string;
};

export const stateDir = join(process.cwd(), "test-results", "e2e-state");
export const stateFile = join(stateDir, "run.json");
export const ownerAuthFile = join(stateDir, "owner.json");
export const consumerAuthFile = join(stateDir, "consumer.json");

export function readE2EState(): E2EState {
  return JSON.parse(readFileSync(stateFile, "utf8")) as E2EState;
}

export function e2eHeaders(): Record<string, string> {
  return {
    "x-contrakt-e2e-key":
      process.env.E2E_AUTH_SECRET ?? "contrakt-e2e-local-secret",
    "content-type": "application/json",
  };
}
