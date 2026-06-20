/**
 * seed-demo.ts — populates the database with a demo user, contract, and
 * monetization config so the earnings dashboard has something to show.
 *
 * Run: npx tsx scripts/seed-demo.ts
 * Requires: DATABASE_URL in env (or .env.local)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../lib/schema.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const DEMO_USER_ID = "demo-github-1234";
const DEMO_USERNAME = "demo";
const DEMO_APP_NAME = "my-saas-api";
const DEMO_SLUG = `${DEMO_USERNAME}/${DEMO_APP_NAME}`;

const RECEIVER_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C9b8F3b4D7e5A1"; // fake
const PRICE_USD = "0.001";

async function main() {
  console.log("Seeding demo data…");

  // ── 1. User ──────────────────────────────────────────────────────────────
  await db
    .insert(schema.users)
    .values({
      id: DEMO_USER_ID,
      username: DEMO_USERNAME,
      avatarUrl: null,
    })
    .onConflictDoNothing();

  console.log("✓ User:", DEMO_USERNAME);

  // ── 2. Contract ───────────────────────────────────────────────────────────
  const contractId = randomUUID();
  await db
    .insert(schema.contracts)
    .values({
      id: contractId,
      userId: DEMO_USER_ID,
      name: DEMO_APP_NAME,
      slug: DEMO_SLUG,
      endpointCount: 3,
      stack: "nextjs",
      contract: {
        projectRoot: "/home/demo/my-saas-api",
        schemaSyncVersion: "0.1.0",
        generatedAt: new Date().toISOString(),
        endpoints: [
          { method: "GET", path: "/api/users", description: "List users" },
          { method: "POST", path: "/api/users", description: "Create user" },
          { method: "GET", path: "/api/users/[id]", description: "Get user by ID" },
        ],
      },
    })
    .onConflictDoNothing();

  console.log("✓ Contract:", DEMO_SLUG);

  // ── 3. Monetization config ────────────────────────────────────────────────
  const monetizationId = randomUUID();
  const existing = await db.query.monetizationConfigs.findFirst({
    where: eq(schema.monetizationConfigs.contractId, contractId),
  });

  if (!existing) {
    await db.insert(schema.monetizationConfigs).values({
      id: monetizationId,
      contractId,
      receiverAddress: RECEIVER_ADDRESS,
      priceUsd: PRICE_USD,
      freeTierCalls: 3,
      enabled: true,
    });
    console.log("✓ Monetization config:", monetizationId);
  } else {
    console.log("✓ Monetization config already exists, skipping");
  }

  const configId = existing?.id ?? monetizationId;

  // ── 4. Payment receipts (sample) ──────────────────────────────────────────
  const sampleReceipts = [
    {
      agentId: "0xAgentWallet001",
      txHash: "0x" + "a".repeat(64),
      amountUsdc: "1000", // 0.001 USDC
    },
    {
      agentId: "0xAgentWallet002",
      txHash: "0x" + "b".repeat(64),
      amountUsdc: "1000",
    },
    {
      agentId: "0xAgentWallet003",
      txHash: "0x" + "c".repeat(64),
      amountUsdc: "2000", // 0.002 USDC
    },
  ];

  for (const r of sampleReceipts) {
    await db
      .insert(schema.paymentReceipts)
      .values({
        id: randomUUID(),
        monetizationConfigId: configId,
        agentId: r.agentId,
        txHash: r.txHash,
        chainId: 84532,
        blockNumber: "0",
        amountUsdc: r.amountUsdc,
      })
      .onConflictDoNothing();
  }

  console.log(`✓ Payment receipts: ${sampleReceipts.length} seeded`);

  // ── 5. Free-tier usage (today) ────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const freeTierEntries = [
    { agentId: "0xAgentWallet004", callCount: 2 },
    { agentId: "0xAgentWallet005", callCount: 3 },
    { agentId: "0xAgentWallet001", callCount: 1 },
  ];

  for (const entry of freeTierEntries) {
    await db
      .insert(schema.freeTierUsage)
      .values({
        id: randomUUID(),
        monetizationConfigId: configId,
        agentId: entry.agentId,
        date: today,
        callCount: entry.callCount,
      })
      .onConflictDoNothing();
  }

  console.log(`✓ Free-tier usage: ${freeTierEntries.length} entries seeded for ${today}`);

  console.log("\nDone! Open /u/demo/my-saas-api/earnings to see the dashboard.");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
