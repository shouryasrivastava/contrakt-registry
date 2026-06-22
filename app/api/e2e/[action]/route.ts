import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { authorizeE2ERequest } from "@/lib/e2e";
import { e2eEnabled } from "@/lib/e2e";
import {
  apiTokens,
  contracts,
  contractVersions,
  monetizationConfigs,
  paymentReceipts,
  userWallets,
  users,
} from "@/lib/schema";
import { hashApiToken, tokenPrefix } from "@/lib/token-security";
import { enforceRateLimit, requestIdentifier } from "@/lib/rate-limit";

type Params = Promise<{ action: string }>;

function usernames(runId: string) {
  const safe = runId.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 60);
  return {
    owner: `e2e-owner-${safe}`,
    consumer: `e2e-consumer-${safe}`,
  };
}

function sampleContract() {
  return {
    schemaSyncVersion: "0.1.9",
    generatedAt: new Date().toISOString(),
    projectRoot: "/tmp/contrakt-e2e",
    stack: "nextjs-app-router",
    endpoints: [
      {
        path: "/api/health",
        method: "GET",
        sourceFile: "app/api/health/route.ts",
        responseSchema: {
          type: "object",
          properties: { status: { type: "string" } },
          required: ["status"],
        },
        statusCodes: [200],
      },
      {
        path: "/api/customers",
        method: "POST",
        sourceFile: "app/api/customers/route.ts",
        requestSchema: {
          type: "object",
          properties: { email: { type: "string" } },
          required: ["email"],
        },
        responseSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
          },
          required: ["id", "email"],
        },
        statusCodes: [201],
      },
    ],
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params },
) {
  const denied = authorizeE2ERequest(request);
  if (denied) return denied;

  const { action } = await params;
  if (action === "webhook-receiver") {
    if (
      !e2eEnabled() ||
      request.nextUrl.searchParams.get("key") !== process.env.E2E_AUTH_SECRET
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    runId?: string;
  };
  const runId = String(body.runId ?? "");
  if (!/^[a-zA-Z0-9-]{4,80}$/.test(runId)) {
    return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
  }
  const names = usernames(runId);
  const ownerId = `e2e:${names.owner}`;
  const consumerId = `e2e:${names.consumer}`;

  if (action === "cleanup") {
    await db.delete(users).where(inArray(users.id, [ownerId, consumerId]));
    return NextResponse.json({ cleaned: true });
  }

  if (action === "sentry") {
    const eventId = Sentry.captureException(
      new Error(`Contrakt E2E Sentry check ${runId}`),
      { tags: { e2e: "true", runId } },
    );
    await Sentry.flush(2000);
    return NextResponse.json({ eventId });
  }

  if (action !== "setup") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // A fixed run id is used for visual baselines, so setup must be repeatable.
  await db.delete(users).where(inArray(users.id, [ownerId, consumerId]));
  await db
    .insert(users)
    .values([
      { id: ownerId, username: names.owner },
      { id: consumerId, username: names.consumer },
    ])
    .onConflictDoNothing();

  const rawToken = `ctr_e2e_${runId}_${nanoid(12)}`;
  const consumerToken = `ctr_e2e_consumer_${runId}_${nanoid(12)}`;
  await db.insert(apiTokens).values([
    {
      id: nanoid(),
      userId: ownerId,
      tokenHash: hashApiToken(rawToken),
      tokenPrefix: tokenPrefix(rawToken),
    },
    {
      id: nanoid(),
      userId: consumerId,
      tokenHash: hashApiToken(consumerToken),
      tokenPrefix: tokenPrefix(consumerToken),
    },
  ]);

  const appName = `api-${runId.toLowerCase()}`;
  const slug = `${names.owner}/${appName}`;
  const contractData = sampleContract();
  await db
    .insert(contracts)
    .values({
      id: nanoid(),
      userId: ownerId,
      name: appName,
      slug,
      contract: contractData,
      endpointCount: contractData.endpoints.length,
      stack: contractData.stack,
      description: "Deterministic Contrakt E2E fixture.",
      baseUrl: null,
    })
    .onConflictDoNothing();
  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });
  if (!contract) {
    return NextResponse.json(
      { error: "Fixture creation failed" },
      { status: 500 },
    );
  }
  const version = await db.query.contractVersions.findFirst({
    where: eq(contractVersions.contractId, contract.id),
  });
  if (!version) {
    await db.insert(contractVersions).values({
      id: nanoid(),
      contractId: contract.id,
      version: 1,
      contract: contractData,
      endpointCount: contractData.endpoints.length,
      diff: { breaking: [], nonBreaking: [], additive: [] },
    });
  }

  return NextResponse.json({
    runId,
    owner: names.owner,
    consumer: names.consumer,
    ownerId,
    consumerId,
    slug,
    appName,
    token: rawToken,
    consumerToken,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  const denied = authorizeE2ERequest(request);
  if (denied) return denied;
  const { action } = await params;
  if (action !== "rate-limit") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const limited = await enforceRateLimit({
    namespace: "e2e-real-redis",
    identifier: `${requestIdentifier(request)}:${request.nextUrl.searchParams.get("runId") ?? "unknown"}`,
    limit: 2,
    windowSeconds: 2,
  });
  return limited ?? NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params },
) {
  const denied = authorizeE2ERequest(request);
  if (denied) return denied;
  const { action } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    runId?: string;
    slug?: string;
    address?: string;
  };
  const runId = String(body.runId ?? "");
  if (!/^[a-zA-Z0-9-]{4,80}$/.test(runId)) {
    return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
  }
  const names = usernames(runId);
  const ownerId = `e2e:${names.owner}`;
  const contract = body.slug
    ? await db.query.contracts.findFirst({
        where: eq(contracts.slug, body.slug),
      })
    : null;

  if (action === "wallet") {
    const address =
      body.address ?? "0x1111111111111111111111111111111111111111";
    await db.insert(userWallets).values({
      id: nanoid(),
      userId: ownerId,
      address,
      chainId: 84532,
    });
    return NextResponse.json({ wallet: { address, chainId: 84532 } });
  }

  if (action === "receipt" && contract) {
    let config = await db.query.monetizationConfigs.findFirst({
      where: eq(monetizationConfigs.contractId, contract.id),
    });
    if (!config) {
      [config] = await db
        .insert(monetizationConfigs)
        .values({
          id: nanoid(),
          contractId: contract.id,
          receiverAddress: "0x1111111111111111111111111111111111111111",
          priceUsd: "0.001",
          freeTierCalls: 3,
          enabled: true,
        })
        .returning();
    }
    const suffix = Math.floor(Math.random() * 16).toString(16);
    const txHash = `0x${"1".repeat(63)}${suffix}`;
    const [receipt] = await db
      .insert(paymentReceipts)
      .values({
        id: nanoid(),
        monetizationConfigId: config.id,
        agentId: `e2e-agent-${runId}`,
        txHash,
        chainId: 84532,
        blockNumber: "12345",
        amountUsdc: "1000",
      })
      .returning();
    return NextResponse.json({ receipt });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
