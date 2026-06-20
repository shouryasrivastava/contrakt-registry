import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { ownedContract } from "@/lib/owner-auth";
import { normalizeDeploymentUrl } from "@/lib/deployment-url";
import { revalidatePath } from "next/cache";
import { apiError, readJsonBody } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

type Params = Promise<{ username: string; app: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { username, app } = await params;
  const slug = `${username}/${app}`;
  const result = await ownedContract(req, slug);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error === "unauthorized" ? "Unauthorized" : "Contract not found" },
      { status: result.error === "unauthorized" ? 401 : 404 },
    );
  }
  const limited = await enforceRateLimit({
    namespace: "contract-owner-update",
    identifier: result.userId,
    limit: 30,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const parsed = await readJsonBody<{
    baseUrl?: unknown;
    description?: unknown;
  }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  const updates: { baseUrl?: string | null; description?: string | null; updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if ("baseUrl" in body) {
    if (body.baseUrl === "" || body.baseUrl === null) {
      updates.baseUrl = null;
    } else {
      const normalized = normalizeDeploymentUrl(body.baseUrl);
      if (!normalized.ok) {
        return NextResponse.json({ error: normalized.error }, { status: 400 });
      }
      updates.baseUrl = normalized.url;
    }
  }
  if ("description" in body) {
    if (typeof body.description === "string" && body.description.length > 500) {
      return apiError(400, "BAD_REQUEST", "Description must be 500 characters or fewer.");
    }
    updates.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
  }

  const [updated] = await db
    .update(contracts)
    .set(updates)
    .where(eq(contracts.id, result.contract.id))
    .returning();
  revalidatePath("/dashboard");
  revalidatePath(`/u/${slug}`);
  revalidatePath(`/u/${slug}/dashboard`);
  revalidatePath(`/u/${slug}/dashboard/integrations`);
  revalidatePath(`/api/registry/contracts/${slug}/mcp`);
  return NextResponse.json({ contract: updated });
}
