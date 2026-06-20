import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contractDependencies, contracts, users } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { userIdFromBearer } from "@/lib/api-auth";
import { apiError, readJsonBody } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

type Params = Promise<{ username: string; app: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { username, app } = await params;
  const slug = `${username}/${app}`;

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      id: contractDependencies.id,
      consumerName: contractDependencies.consumerName,
      consumerUrl: contractDependencies.consumerUrl,
      lastSeenAt: contractDependencies.lastSeenAt,
      createdAt: contractDependencies.createdAt,
      username: users.username,
    })
    .from(contractDependencies)
    .leftJoin(users, eq(users.id, contractDependencies.userId))
    .where(eq(contractDependencies.contractId, contract.id));

  return NextResponse.json({
    count: rows.length,
    dependencies: rows,
  });
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const userId = await userIdFromBearer(req);
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Missing or invalid API token.");
  }
  const limited = await enforceRateLimit({
    namespace: "dependency-declare",
    identifier: userId,
    limit: 60,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const { username, app } = await params;
  const slug = `${username}/${app}`;

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const parsed = await readJsonBody<{
    consumerName?: unknown;
    consumerUrl?: unknown;
  }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  const consumerName =
    typeof body.consumerName === "string" && body.consumerName.trim()
      ? body.consumerName.trim()
      : "unnamed-consumer";
  if (consumerName.length > 120) {
    return apiError(400, "BAD_REQUEST", "Consumer name must be 120 characters or fewer.");
  }
  let consumerUrl =
    typeof body.consumerUrl === "string" && body.consumerUrl.trim()
      ? body.consumerUrl.trim()
      : null;
  if (consumerUrl) {
    try {
      const parsedUrl = new URL(consumerUrl);
      if (!["https:", "http:"].includes(parsedUrl.protocol)) throw new Error();
      consumerUrl = parsedUrl.toString();
    } catch {
      return apiError(400, "BAD_REQUEST", "Consumer URL must be an absolute HTTP(S) URL.");
    }
  }

  const existing = await db.query.contractDependencies.findFirst({
    where: and(
      eq(contractDependencies.contractId, contract.id),
      eq(contractDependencies.userId, userId),
      eq(contractDependencies.consumerName, consumerName),
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(contractDependencies)
      .set({
        consumerUrl,
        lastSeenAt: new Date(),
      })
      .where(eq(contractDependencies.id, existing.id))
      .returning();
    return NextResponse.json({ dependency: updated });
  }

  const [created] = await db
    .insert(contractDependencies)
    .values({
      id: nanoid(),
      contractId: contract.id,
      userId,
      consumerName,
      consumerUrl,
    })
    .returning();

  return NextResponse.json({ dependency: created }, { status: 201 });
}
