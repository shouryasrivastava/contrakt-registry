import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contractVersions } from "@/lib/schema";
import { ownedContract } from "@/lib/owner-auth";

type Params = Promise<{ username: string; app: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { username, app } = await params;
  const result = await ownedContract(req, `${username}/${app}`);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error === "unauthorized" ? "Unauthorized" : "Contract not found" },
      { status: result.error === "unauthorized" ? 401 : 404 },
    );
  }

  const versions = await db
    .select({
      id: contractVersions.id,
      version: contractVersions.version,
      endpointCount: contractVersions.endpointCount,
      diff: contractVersions.diff,
      publishedAt: contractVersions.publishedAt,
    })
    .from(contractVersions)
    .where(eq(contractVersions.contractId, result.contract.id))
    .orderBy(desc(contractVersions.version))
    .limit(50);
  return NextResponse.json({ versions });
}
