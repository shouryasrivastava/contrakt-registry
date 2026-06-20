import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { ilike, and, or, sql } from "drizzle-orm";
import { enforceRateLimit, requestIdentifier } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit({
    namespace: "registry-search",
    identifier: requestIdentifier(req),
    limit: 120,
    windowSeconds: 60,
  });
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const stack = searchParams.get("stack") ?? "";
  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "10", 10);
  const rawOffset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 50)) : 10;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;

  const conditions = [];
  if (q) {
    conditions.push(or(ilike(contracts.slug, `%${q}%`), ilike(contracts.name, `%${q}%`)));
  }
  if (stack) {
    conditions.push(ilike(contracts.stack, `%${stack}%`));
  }

  const query = db
    .select({
      slug: contracts.slug,
      name: contracts.name,
      endpointCount: contracts.endpointCount,
      stack: contracts.stack,
      updatedAt: contracts.updatedAt,
    })
    .from(contracts)
    .limit(limit)
    .offset(offset)
    .orderBy(sql`${contracts.updatedAt} DESC`);

  const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

  const appUrl = "https://registry.contrakt.dev";
  const results = rows.map((r) => ({
    ...r,
    url: `${appUrl}/u/${r.slug}`,
    contractUrl: `${appUrl}/api/registry/contracts/${r.slug}`,
    mcpConfigUrl: `${appUrl}/api/registry/contracts/${r.slug}/mcp`,
  }));

  return NextResponse.json({ contracts: results, total: results.length });
}
