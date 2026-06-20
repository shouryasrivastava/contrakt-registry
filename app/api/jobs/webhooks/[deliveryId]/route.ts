import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { webhookDeliveries, webhooks } from "@/lib/schema";
import { validateWebhookTarget } from "@/lib/webhook-target";
import { signWebhookPayload } from "@/lib/webhooks";

type Params = Promise<{ deliveryId: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params },
) {
  const workerSecret = process.env.QSTASH_WORKER_SECRET;
  if (!workerSecret || request.headers.get("x-contrakt-worker-key") !== workerSecret) {
    return apiError(401, "UNAUTHORIZED", "Invalid webhook worker credentials.");
  }

  const { deliveryId } = await params;
  const [row] = await db
    .select({
      payload: webhookDeliveries.payload,
      attemptCount: webhookDeliveries.attemptCount,
      url: webhooks.url,
      secret: webhooks.secret,
      enabled: webhooks.enabled,
    })
    .from(webhookDeliveries)
    .innerJoin(webhooks, eq(webhookDeliveries.webhookId, webhooks.id))
    .where(and(eq(webhookDeliveries.id, deliveryId), eq(webhooks.enabled, true)))
    .limit(1);

  if (!row) return apiError(404, "NOT_FOUND", "Webhook delivery was not found.");

  const target = await validateWebhookTarget(row.url, { allowLocalhost: false });
  if (!target.ok) {
    await markFailed(deliveryId, row.attemptCount, target.error);
    return apiError(400, "BAD_REQUEST", target.error);
  }

  const body = JSON.stringify(row.payload);
  try {
    const response = await fetch(target.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Contrakt-Registry/1.0",
        "X-Contrakt-Delivery": deliveryId,
        ...(row.secret
          ? { "X-Contrakt-Signature": signWebhookPayload(body, row.secret) }
          : {}),
      },
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      await markFailed(
        deliveryId,
        row.attemptCount,
        `Destination returned HTTP ${response.status}.`,
        response.status,
      );
      return apiError(502, "SERVICE_UNAVAILABLE", "Webhook destination rejected the delivery.");
    }

    await db
      .update(webhookDeliveries)
      .set({
        status: "delivered",
        attemptCount: row.attemptCount + 1,
        responseCode: response.status,
        lastError: null,
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, deliveryId));
    return NextResponse.json({ delivered: true });
  } catch (error) {
    await markFailed(
      deliveryId,
      row.attemptCount,
      error instanceof Error ? error.message : "Webhook request failed.",
    );
    return apiError(503, "SERVICE_UNAVAILABLE", "Webhook delivery failed and will be retried.");
  }
}

async function markFailed(
  deliveryId: string,
  attempts: number,
  message: string,
  responseCode?: number,
) {
  await db
    .update(webhookDeliveries)
    .set({
      status: "retrying",
      attemptCount: attempts + 1,
      responseCode,
      lastError: message.slice(0, 500),
      updatedAt: new Date(),
    })
    .where(eq(webhookDeliveries.id, deliveryId));
}
