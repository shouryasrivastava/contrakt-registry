import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { webhookDeliveries, webhooks } from "@/lib/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ownedContract as resolveOwnedContract } from "@/lib/owner-auth";
import { apiError, readJsonBody } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateWebhookTarget } from "@/lib/webhook-target";

type Params = Promise<{ username: string; app: string }>;

async function ownedContract(req: NextRequest, params: Params) {
  const { username, app } = await params;
  return resolveOwnedContract(req, `${username}/${app}`);
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const result = await ownedContract(req, params);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error === "unauthorized" ? "Unauthorized" : "Contract not found" },
      { status: result.error === "unauthorized" ? 401 : 404 },
    );
  }

  const rows = await db
    .select({
      id: webhooks.id,
      url: webhooks.url,
      enabled: webhooks.enabled,
      createdAt: webhooks.createdAt,
      updatedAt: webhooks.updatedAt,
    })
    .from(webhooks)
    .where(eq(webhooks.contractId, result.contract.id));

  const hookIds = rows.map((row) => row.id);
  const deliveries = hookIds.length
    ? await db
        .select({
          id: webhookDeliveries.id,
          webhookId: webhookDeliveries.webhookId,
          event: webhookDeliveries.event,
          status: webhookDeliveries.status,
          attemptCount: webhookDeliveries.attemptCount,
          responseCode: webhookDeliveries.responseCode,
          lastError: webhookDeliveries.lastError,
          createdAt: webhookDeliveries.createdAt,
          deliveredAt: webhookDeliveries.deliveredAt,
        })
        .from(webhookDeliveries)
        .where(inArray(webhookDeliveries.webhookId, hookIds))
        .orderBy(desc(webhookDeliveries.createdAt))
        .limit(50)
    : [];

  return NextResponse.json({ webhooks: rows, deliveries });
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const result = await ownedContract(req, params);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error === "unauthorized" ? "Unauthorized" : "Contract not found" },
      { status: result.error === "unauthorized" ? 401 : 404 },
    );
  }

  const limited = await enforceRateLimit({
    namespace: "webhook-create",
    identifier: result.userId,
    limit: 20,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const parsed = await readJsonBody<{
    url?: unknown;
    secret?: unknown;
  }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  const target = await validateWebhookTarget(body.url);
  if (!target.ok) return apiError(400, "BAD_REQUEST", target.error);
  if (typeof body.secret === "string" && body.secret.length > 256) {
    return apiError(400, "BAD_REQUEST", "Webhook secrets must be 256 characters or fewer.");
  }

  const [created] = await db
    .insert(webhooks)
    .values({
      id: nanoid(),
      contractId: result.contract.id,
      userId: result.userId,
      url: target.url,
      secret: typeof body.secret === "string" && body.secret ? body.secret : null,
    })
    .returning();

  return NextResponse.json(
    {
      webhook: {
        id: created.id,
        url: created.url,
        enabled: created.enabled,
        createdAt: created.createdAt,
      },
    },
    { status: 201 },
  );
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const result = await ownedContract(req, params);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error === "unauthorized" ? "Unauthorized" : "Contract not found" },
      { status: result.error === "unauthorized" ? 401 : 404 },
    );
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing webhook id" }, { status: 400 });
  }

  const deleted = await db
    .delete(webhooks)
    .where(
      and(
        eq(webhooks.id, id),
        eq(webhooks.contractId, result.contract.id),
        eq(webhooks.userId, result.userId),
      ),
    )
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
