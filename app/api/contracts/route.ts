import { after, NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, contractVersions, users } from "@/lib/schema";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { contractUrl } from "@/lib/site";
import { enqueueContractWebhooks } from "@/lib/webhooks";
import { userIdFromBearer } from "@/lib/api-auth";
import { diffContracts } from "@/lib/contract-diff";
import { apiError, readJsonBody } from "@/lib/api-response";
import { enforceRateLimit, requestIdentifier } from "@/lib/rate-limit";
import { normalizeDeploymentUrl } from "@/lib/deployment-url";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit({
    namespace: "contract-publish",
    identifier: requestIdentifier(req),
    limit: 30,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const userId = await userIdFromBearer(req);
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Missing or invalid API token.");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return apiError(401, "UNAUTHORIZED", "The API token owner no longer exists.");
  }

  const parsed = await readJsonBody<{
    name?: unknown;
    contract?: unknown;
    baseUrl?: unknown;
  }>(req, 2_000_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 80) {
    return apiError(400, "BAD_REQUEST", "Name must be between 1 and 80 characters.");
  }

  if (!body.contract || typeof body.contract !== "object" || Array.isArray(body.contract)) {
    return apiError(400, "BAD_REQUEST", "Contract must be a JSON object.");
  }

  const contractData = body.contract as Record<string, unknown>;
  const slugifiedName = slugify(body.name);
  const slug = `${user.username}/${slugifiedName}`;

  const endpoints = Array.isArray(contractData.endpoints)
    ? contractData.endpoints
    : [];
  if (endpoints.length > 1_000) {
    return apiError(400, "BAD_REQUEST", "Contracts may contain at most 1,000 endpoints.");
  }
  const endpointCount = endpoints.length;
  const stack =
    typeof contractData.stack === "string" ? contractData.stack : null;
  let baseUrl: string | null | undefined;
  if (body.baseUrl !== undefined) {
    const normalized = normalizeDeploymentUrl(body.baseUrl);
    if (!normalized.ok) return apiError(400, "BAD_REQUEST", normalized.error);
    baseUrl = normalized.url;
  }

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${slug}))`);

    const existingContract = await tx.query.contracts.findFirst({
      where: eq(contracts.slug, slug),
    });
    const diff = existingContract
      ? diffContracts(existingContract.contract, contractData)
      : { breaking: [], nonBreaking: [], additive: [] };
    const contractId = existingContract?.id ?? nanoid();
    const event: "contract.created" | "contract.updated" = existingContract
      ? "contract.updated"
      : "contract.created";

    if (existingContract) {
      await tx
        .update(contracts)
        .set({
          contract: contractData,
          endpointCount,
          stack,
          ...(baseUrl !== undefined ? { baseUrl } : {}),
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, contractId));
    } else {
      await tx.insert(contracts).values({
        id: contractId,
        userId: user.id,
        name: slugifiedName,
        slug,
        contract: contractData,
        endpointCount,
        stack,
        baseUrl: baseUrl ?? null,
      });
    }

    const [versionRow] = await tx
      .select({
        value: sql<number>`coalesce(max(${contractVersions.version}), 0)`,
      })
      .from(contractVersions)
      .where(eq(contractVersions.contractId, contractId));
    const version = Number(versionRow?.value ?? 0) + 1;

    await tx.insert(contractVersions).values({
      id: nanoid(),
      contractId,
      version,
      contract: contractData,
      endpointCount,
      diff,
    });

    return { contractId, event, version, diff };
  });

  const url = contractUrl(slug);

  after(async () => {
    await enqueueContractWebhooks(result.contractId, {
      event: result.event,
      contract: {
        id: result.contractId,
        slug,
        url,
        endpointCount,
        stack,
        updatedAt: new Date().toISOString(),
        version: result.version,
        changes: {
          breaking: result.diff.breaking.length,
          nonBreaking: result.diff.nonBreaking.length,
          additive: result.diff.additive.length,
        },
      },
    }).catch((error) => {
      console.error("[webhooks] enqueue failed", error);
    });
  });

  return NextResponse.json(
    {
      id: result.contractId,
      url,
      slug,
      version: result.version,
      diff: result.diff,
    },
    { status: 200 },
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const stack = searchParams.get("stack") ?? "";
  const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const parsedOffset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 100)) : 20;
  const offset = Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset) : 0;

  const conditions = [];

  if (q) {
    conditions.push(
      or(
        ilike(contracts.slug, `%${q}%`),
        ilike(contracts.name, `%${q}%`)
      )
    );
  }

  if (stack) {
    conditions.push(ilike(contracts.stack, `%${stack}%`));
  }

  const query = db
    .select({
      id: contracts.id,
      slug: contracts.slug,
      name: contracts.name,
      endpointCount: contracts.endpointCount,
      stack: contracts.stack,
      createdAt: contracts.createdAt,
      updatedAt: contracts.updatedAt,
    })
    .from(contracts)
    .limit(limit)
    .offset(offset)
    .orderBy(sql`${contracts.updatedAt} DESC`);

  let results;
  if (conditions.length > 0) {
    results = await query.where(and(...conditions));
  } else {
    results = await query;
  }

  return NextResponse.json({ contracts: results });
}
