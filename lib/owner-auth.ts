import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "./auth";
import { userIdFromBearer } from "./api-auth";
import { db } from "./db";
import { contracts } from "./schema";

export async function authenticatedUserId(req: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  return userIdFromBearer(req);
}

export async function ownedContract(req: NextRequest, slug: string) {
  const userId = await authenticatedUserId(req);
  if (!userId) return { error: "unauthorized" as const };
  const contract = await db.query.contracts.findFirst({
    where: and(eq(contracts.slug, slug), eq(contracts.userId, userId)),
  });
  if (!contract) return { error: "not-found" as const };
  return { contract, userId };
}
