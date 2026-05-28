import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string; app: string }> }
) {
  const { username, app } = await params;
  const slug = `${username}/${app}`;

  const row = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });

  if (!row) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://contrakt-registry.vercel.app";

  return NextResponse.json({
    id: row.id,
    slug: row.slug,
    name: row.name,
    stack: row.stack,
    endpointCount: row.endpointCount,
    contract: row.contract,
    url: `${appUrl}/c/${slug}`,
    mcpConfigUrl: `${appUrl}/api/registry/contracts/${slug}/mcp`,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
