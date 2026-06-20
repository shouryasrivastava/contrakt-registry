/**
 * GET /api/registry/contracts/[username]/[app]/free-tier/[agentId]
 *
 * Returns free-tier usage for a given agent+contract pair, for today (UTC).
 * Also increments the counter if ?consume=true is passed.
 *
 * Used by the generated MCP server before enforcing payment.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, monetizationConfigs, freeTierUsage } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getX402Network } from "@/lib/x402";
import { apiError } from "@/lib/api-response";
import { enforceRateLimit, requestIdentifier } from "@/lib/rate-limit";

type Params = Promise<{ username: string; app: string; agentId: string }>;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { username, app, agentId } = await params;
  if (!/^[a-zA-Z0-9._:@/-]{1,128}$/.test(agentId)) {
    return apiError(400, "BAD_REQUEST", "Invalid agent identifier.");
  }
  const limited = await enforceRateLimit({
    namespace: "free-tier",
    identifier: `${requestIdentifier(req)}:${username}/${app}:${agentId}`,
    limit: 120,
    windowSeconds: 60,
  });
  if (limited) return limited;
  const slug = `${username}/${app}`;
  const consume = new URL(req.url).searchParams.get("consume") === "true";

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const config = await db.query.monetizationConfigs.findFirst({
    where: eq(monetizationConfigs.contractId, contract.id),
  });

  // If monetization not configured, free tier is effectively unlimited
  if (!config || !config.enabled) {
    return NextResponse.json({
      allowed: true,
      freeTierCalls: null,
      usedToday: 0,
      remainingToday: null,
    });
  }

  const date = todayUTC();

  const row = await db.query.freeTierUsage.findFirst({
    where: and(
      eq(freeTierUsage.monetizationConfigId, config.id),
      eq(freeTierUsage.agentId, agentId),
      eq(freeTierUsage.date, date)
    ),
  });

  const usedToday = row?.callCount ?? 0;
  const remaining = config.freeTierCalls - usedToday;
  const allowed = remaining > 0;

  let consumedCount = usedToday;
  if (consume && allowed) {
    const [consumed] = await db
      .insert(freeTierUsage)
      .values({
        id: randomUUID(),
        monetizationConfigId: config.id,
        agentId,
        date,
        callCount: 1,
      })
      .onConflictDoUpdate({
        target: [
          freeTierUsage.monetizationConfigId,
          freeTierUsage.agentId,
          freeTierUsage.date,
        ],
        set: { callCount: sql`${freeTierUsage.callCount} + 1` },
      })
      .returning({ callCount: freeTierUsage.callCount });
    consumedCount = consumed.callCount;
  }

  return NextResponse.json({
    allowed,
    freeTierCalls: config.freeTierCalls,
    usedToday: consumedCount,
    remainingToday: Math.max(0, config.freeTierCalls - consumedCount),
    paymentRequired: allowed
      ? null
      : (() => {
          const net = getX402Network();
          return {
            network: net.name,
            token: "USDC",
            tokenAddress: net.usdcAddress,
            receiverAddress: config.receiverAddress,
            priceUsd: config.priceUsd,
          };
        })(),
  });
}
