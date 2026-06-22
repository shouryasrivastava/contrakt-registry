import { defineConfig, devices } from "@playwright/test";
import {
  consumerAuthFile,
  ownerAuthFile,
} from "./tests/e2e/support/state";

const visualRun = process.env.E2E_VISUAL === "true";

const crossBrowserProjects =
  process.env.E2E_ALL_BROWSERS === "true" && !visualRun
    ? [
        {
          name: "public-firefox",
          testMatch: /public(?!.*production-smoke)/,
          use: { ...devices["Desktop Firefox"] },
        },
        {
          name: "owner-firefox",
          testMatch: /accessibility|mobile-smoke/,
          use: { ...devices["Desktop Firefox"], storageState: ownerAuthFile },
        },
        {
          name: "public-webkit",
          testMatch: /public(?!.*production-smoke)/,
          use: { ...devices["Desktop Safari"] },
        },
        {
          name: "owner-webkit",
          testMatch: /accessibility|mobile-smoke/,
          use: { ...devices["Desktop Safari"], storageState: ownerAuthFile },
        },
      ]
    : [];

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  timeout: 60_000,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    navigationTimeout: 60_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: visualRun
    ? [
        {
          name: "owner-desktop",
          testMatch: /visual/,
          use: { ...devices["Desktop Chrome"], storageState: ownerAuthFile },
        },
        {
          name: "owner-mobile",
          testMatch: /visual/,
          use: { ...devices["Pixel 7"], storageState: ownerAuthFile },
        },
      ]
    : [
        {
          name: "public-desktop",
          testMatch: /public(?!.*production-smoke)/,
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "public-mobile",
          testMatch: /public(?!.*production-smoke)/,
          use: { ...devices["Pixel 7"] },
        },
        {
          name: "owner-desktop",
          testIgnore:
            /public|consumer|production-smoke|real-integrations|visual|mobile-smoke/,
          use: { ...devices["Desktop Chrome"], storageState: ownerAuthFile },
        },
        {
          name: "owner-mobile",
          testMatch: /mobile-smoke/,
          use: { ...devices["Pixel 7"], storageState: ownerAuthFile },
        },
        {
          name: "consumer-desktop",
          testMatch: /consumer/,
          use: { ...devices["Desktop Chrome"], storageState: consumerAuthFile },
        },
        ...crossBrowserProjects,
      ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command:
          "E2E_TEST_MODE=true NEXT_PUBLIC_E2E_TEST_MODE=true E2E_AUTH_SECRET=${E2E_AUTH_SECRET:-contrakt-e2e-local-secret} AUTH_URL=http://127.0.0.1:3000 AUTH_TRUST_HOST=true NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_REGISTRY_URL=http://127.0.0.1:3000 NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000 pnpm build && E2E_TEST_MODE=true NEXT_PUBLIC_E2E_TEST_MODE=true E2E_AUTH_SECRET=${E2E_AUTH_SECRET:-contrakt-e2e-local-secret} AUTH_URL=http://127.0.0.1:3000 AUTH_TRUST_HOST=true NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_REGISTRY_URL=http://127.0.0.1:3000 NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000 pnpm start",
        url: "http://127.0.0.1:3000/api/health",
        reuseExistingServer: false,
        timeout: 240_000,
      },
});
