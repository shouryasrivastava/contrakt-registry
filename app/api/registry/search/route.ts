import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { ilike, and, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const stack = searchParams.get("stack") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://contrakt-registry.vercel.app";
  const results = rows.map((r) => ({
    ...r,
    url: `${appUrl}/c/${r.slug}`,
    contractUrl: `${appUrl}/api/registry/contracts/${r.slug}`,
    mcpConfigUrl: `${appUrl}/api/registry/contracts/${r.slug}/mcp`,
  }));

  return NextResponse.json({ contracts: results, total: results.length });
}
