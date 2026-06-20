import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, monetizationConfigs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getX402Network } from "@/lib/x402";
import { ownedContract } from "@/lib/owner-auth";
import { getAddress, isAddress } from "viem";
import { revalidatePath } from "next/cache";
import { readJsonBody } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

type Params = Promise<{ username: string; app: string }>;

// GET /api/registry/contracts/[username]/[app]/monetization
// Returns the monetization config for this contract (public — agents need this to know how to pay)
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { username, app } = await params;
  const slug = `${username}/${app}`;

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const config = await db.query.monetizationConfigs.findFirst({
    where: eq(monetizationConfigs.contractId, contract.id),
  });

  if (!config || !config.enabled) {
    return NextResponse.json({ monetization: null });
  }

  const net = getX402Network();
  return NextResponse.json({
    monetization: {
      enabled: config.enabled,
      receiverAddress: config.receiverAddress,
      priceUsd: config.priceUsd,
      freeTierCalls: config.freeTierCalls,
      network: net.name,
      token: "USDC",
      tokenAddress: net.usdcAddress,
    },
  });
}

// PUT /api/registry/contracts/[username]/[app]/monetization
// Upsert monetization config. Owner only — authenticated via Bearer API token.
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const { username, app } = await params;
  const slug = `${username}/${app}`;

  const owner = await ownedContract(req, slug);
  if ("error" in owner) {
    return NextResponse.json(
      { error: owner.error === "unauthorized" ? "Unauthorized" : "Contract not found" },
      { status: owner.error === "unauthorized" ? 401 : 404 },
    );
  }
  const contract = owner.contract;
  const limited = await enforceRateLimit({
    namespace: "monetization-update",
    identifier: owner.userId,
    limit: 30,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const parsed = await readJsonBody<{
    receiverAddress?: unknown;
    priceUsd?: unknown;
    freeTierCalls?: unknown;
    enabled?: unknown;
  }>(req, 8_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  const existing = await db.query.monetizationConfigs.findFirst({
    where: eq(monetizationConfigs.contractId, contract.id),
  });
  const receiverAddress =
    body.receiverAddress === undefined
      ? undefined
      : typeof body.receiverAddress === "string" && isAddress(body.receiverAddress)
        ? getAddress(body.receiverAddress)
        : null;
  if (body.receiverAddress !== undefined && !receiverAddress) {
    return NextResponse.json({ error: "Enter a valid EVM receiver address." }, { status: 400 });
  }
  const price = body.priceUsd === undefined ? undefined : Number(body.priceUsd);
  if (price !== undefined && (!Number.isFinite(price) || price <= 0)) {
    return NextResponse.json({ error: "Price per call must be greater than zero." }, { status: 400 });
  }
  if (
    body.freeTierCalls !== undefined &&
    (typeof body.freeTierCalls !== "number" ||
      !Number.isInteger(body.freeTierCalls) ||
      body.freeTierCalls < 0 ||
      body.freeTierCalls > 100_000)
  ) {
    return NextResponse.json({ error: "Free calls must be a whole number of zero or more." }, { status: 400 });
  }

  if (existing) {
    const [updated] = await db
      .update(monetizationConfigs)
      .set({
        receiverAddress: receiverAddress ?? existing.receiverAddress,
        priceUsd: typeof body.priceUsd === "string" ? body.priceUsd : existing.priceUsd,
        freeTierCalls: typeof body.freeTierCalls === "number" ? body.freeTierCalls : existing.freeTierCalls,
        enabled: typeof body.enabled === "boolean" ? body.enabled : existing.enabled,
        updatedAt: new Date(),
      })
      .where(eq(monetizationConfigs.id, existing.id))
      .returning();
    revalidatePath(`/u/${slug}`);
    revalidatePath(`/u/${slug}/dashboard`);
    revalidatePath(`/u/${slug}/dashboard/monetization`);
    revalidatePath(`/api/registry/contracts/${slug}/mcp`);
    return NextResponse.json({ monetization: updated });
  }

  // Validate required fields for creation
  if (!receiverAddress || typeof body.priceUsd !== "string") {
    return NextResponse.json(
      { error: "receiverAddress and priceUsd are required" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(monetizationConfigs)
    .values({
      id: randomUUID(),
      contractId: contract.id,
      receiverAddress,
      priceUsd: body.priceUsd,
      freeTierCalls: typeof body.freeTierCalls === "number" ? body.freeTierCalls : 3,
      enabled: typeof body.enabled === "boolean" ? body.enabled : true,
    })
    .returning();

  revalidatePath(`/u/${slug}`);
  revalidatePath(`/u/${slug}/dashboard`);
  revalidatePath(`/u/${slug}/dashboard/monetization`);
  revalidatePath(`/api/registry/contracts/${slug}/mcp`);
  return NextResponse.json({ monetization: created }, { status: 201 });
}
