/**
 * GET /api/registry/stats — global registry totals for the home-page banner.
 * Cached for 30s at the edge.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, paymentReceipts, freeTierUsage } from "@/lib/schema";
import { sql, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = new Date().toISOString().slice(0, 10);

    const [contractCount, receipts, ft, recent24h] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(contracts),
      db.select({ agentId: paymentReceipts.agentId, amountUsdc: paymentReceipts.amountUsdc }).from(paymentReceipts),
      db.select({ agentId: freeTierUsage.agentId, callCount: freeTierUsage.callCount, date: freeTierUsage.date }).from(freeTierUsage),
      db.select({ n: sql<number>`count(*)::int` }).from(paymentReceipts).where(gte(paymentReceipts.verifiedAt, since)),
    ]);

    const settledRaw = receipts.reduce((s, r) => s + BigInt(r.amountUsdc), 0n);
    const usdcSettled = Number(settledRaw) / 1_000_000;

    const agents = new Set<string>();
    receipts.forEach((r) => agents.add(r.agentId));
    ft.forEach((r) => agents.add(r.agentId));

    const freeCallsToday = ft
      .filter((r) => r.date === today)
      .reduce((s, r) => s + r.callCount, 0);

    const callsServed24h = (recent24h[0]?.n ?? 0) + freeCallsToday;

    const body = {
      contractsPublished: contractCount[0]?.n ?? 0,
      usdcSettled,
      activeAgents: agents.size,
      callsServed24h,
    };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json(
      { contractsPublished: 0, usdcSettled: 0, activeAgents: 0, callsServed24h: 0 },
      { headers: { "Cache-Control": "public, s-maxage=10" } }
    );
  }
}
