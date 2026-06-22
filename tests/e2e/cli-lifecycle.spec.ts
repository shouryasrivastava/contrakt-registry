import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { expect, test } from "@playwright/test";
import { readE2EState } from "./support/state";

function run(
  command: string,
  args: string[],
  cwd: string,
  expectedStatus = 0,
) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  expect(
    result.status,
    `${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`,
  ).toBe(expectedStatus);
  return `${result.stdout}\n${result.stderr}`;
}

test("packed CLI completes the staging registry lifecycle", async ({
  page,
}, testInfo) => {
  test.skip(process.env.CLI_E2E !== "true", "Enable with CLI_E2E=true");
  test.skip(testInfo.project.name !== "owner-desktop", "Run once");

  const state = readE2EState();
  const baseURL =
    process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  const cliDir = resolve(
    process.env.CONTRAKT_CLI_DIR ?? join(process.cwd(), "..", "schemasync"),
  );
  expect(existsSync(join(cliDir, "package.json"))).toBeTruthy();

  const root = join(tmpdir(), `contrakt-e2e-${state.runId}`);
  const installDir = join(root, "install");
  const appDir = join(root, "app");
  mkdirSync(join(appDir, "app", "api", "health"), { recursive: true });
  mkdirSync(installDir, { recursive: true });
  writeFileSync(
    join(installDir, "package.json"),
    JSON.stringify({ private: true }, null, 2),
  );
  writeFileSync(
    join(appDir, "package.json"),
    JSON.stringify({ name: state.appName, private: true, type: "module" }, null, 2),
  );
  const routeFile = join(appDir, "app", "api", "health", "route.ts");
  writeFileSync(
    routeFile,
    'import { NextResponse } from "next/server";\nexport function GET() { return NextResponse.json({ status: "ok", version: 1 }); }\n',
  );

  const tarballName = run("npm", ["pack", "--silent"], cliDir).trim().split("\n").at(-1);
  if (!tarballName) throw new Error("npm pack did not return a tarball name");
  const tarball = join(cliDir, basename(tarballName));
  run("npm", ["install", "--ignore-scripts", tarball], installDir);
  const bin = join(installDir, "node_modules", ".bin", "contrakt");

  run(bin, ["init", "--cwd", appDir, "--base-url", baseURL, "--force", "--no-mcp"], appDir);
  run(bin, ["doctor", "--cwd", appDir], appDir);
  run(bin, ["check", "--cwd", appDir], appDir);
  run(
    bin,
    [
      "publish",
      "--cwd",
      appDir,
      "--name",
      state.appName,
      "--token",
      state.token,
      "--registry",
      baseURL,
    ],
    appDir,
  );

  writeFileSync(
    routeFile,
    'import { NextResponse } from "next/server";\nexport function GET() { return NextResponse.json({ status: "ok" }); }\n',
  );
  run(bin, ["check", "--cwd", appDir], appDir, 1);
  run(bin, ["check", "--cwd", appDir, "--update"], appDir);
  run(
    bin,
    [
      "publish",
      "--cwd",
      appDir,
      "--name",
      state.appName,
      "--token",
      state.token,
      "--registry",
      baseURL,
    ],
    appDir,
  );

  const publicUrl = `${baseURL}/u/${state.slug}`;
  run(
    bin,
    [
      "watch",
      publicUrl,
      "--cwd",
      appDir,
      "--once",
      "--depend",
      "--token",
      state.consumerToken,
      "--consumer-name",
      `cli-${state.runId}`,
      "--consumer-url",
      "https://github.com/example/cli-consumer",
    ],
    appDir,
  );
  run(
    bin,
    [
      "webhook",
      publicUrl,
      "https://reachable.e2e.test/cli-hook",
      "--token",
      state.token,
    ],
    appDir,
  );
  run(
    bin,
    ["webhook", publicUrl, "--list", "--token", state.token],
    appDir,
  );
  run(bin, ["mcp", "--cwd", appDir, "--base-url", baseURL], appDir);
  run(
    bin,
    [
      "monetize",
      "--cwd",
      appDir,
      "--receiver",
      "0x1111111111111111111111111111111111111111",
      "--price",
      "0.001",
      "--free-calls",
      "3",
      "--publish",
      "--token",
      state.token,
      "--registry",
      baseURL,
    ],
    appDir,
  );

  const generated = readFileSync(
    join(appDir, ".contrakt", "contrakt-mcp-server.ts"),
    "utf8",
  );
  expect(generated).toContain(baseURL);
  expect(generated).toContain("withX402");

  await page.goto(`/u/${state.slug}/dashboard`);
  await expect(page.getByText(/Version 3/)).toBeVisible();
  await page.goto(`/u/${state.slug}/dashboard/consumers`);
  await expect(page.getByText(`cli-${state.runId}`)).toBeVisible();
});
