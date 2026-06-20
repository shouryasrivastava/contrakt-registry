import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./db";
import { REGISTRY_URL } from "./site";
import { webhookDeliveries, webhooks } from "./schema";

export interface ContractEventPayload {
  event: "contract.created" | "contract.updated";
  contract: {
    id: string;
    slug: string;
    url: string;
    endpointCount: number;
    stack: string | null;
    updatedAt: string;
    version: number;
    changes: {
      breaking: number;
      nonBreaking: number;
      additive: number;
    };
  };
}

export async function enqueueContractWebhooks(
  contractId: string,
  payload: ContractEventPayload,
): Promise<void> {
  const rows = await db.query.webhooks.findMany({
    where: eq(webhooks.contractId, contractId),
  });
  const active = rows.filter((row) => row.enabled);
  if (active.length === 0) return;

  await Promise.allSettled(
    active.map(async (hook) => {
      const deliveryId = nanoid();
      await db.insert(webhookDeliveries).values({
        id: deliveryId,
        webhookId: hook.id,
        event: payload.event,
        payload,
      });
      await enqueueDelivery(deliveryId);
    }),
  );
}

async function enqueueDelivery(deliveryId: string): Promise<void> {
  const qstashToken = process.env.QSTASH_TOKEN;
  const workerSecret = process.env.QSTASH_WORKER_SECRET;
  if (!qstashToken || !workerSecret) {
    await db
      .update(webhookDeliveries)
      .set({
        status: "configuration-error",
        lastError: "QStash is not configured.",
        updatedAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, deliveryId));
    if (process.env.NODE_ENV === "production") {
      throw new Error("QStash is required for webhook delivery in production.");
    }
    return;
  }

  const destination = `${REGISTRY_URL}/api/jobs/webhooks/${deliveryId}`;
  const response = await fetch(
    `https://qstash.upstash.io/v2/publish/${encodeURIComponent(destination)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${qstashToken}`,
        "Content-Type": "application/json",
        "Upstash-Retries": "5",
        "Upstash-Deduplication-Id": deliveryId,
        "Upstash-Forward-X-Contrakt-Worker-Key": workerSecret,
      },
      body: JSON.stringify({ deliveryId }),
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!response.ok) {
    const message = `QStash returned HTTP ${response.status}.`;
    await db
      .update(webhookDeliveries)
      .set({ status: "enqueue-failed", lastError: message, updatedAt: new Date() })
      .where(eq(webhookDeliveries.id, deliveryId));
    throw new Error(message);
  }
}

export function signWebhookPayload(body: string, secret: string): string {
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  return `sha256=${digest}`;
}
