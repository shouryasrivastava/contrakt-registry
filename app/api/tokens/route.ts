import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { hashApiToken, tokenPrefix } from "@/lib/token-security";
import { apiError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return apiError(401, "UNAUTHORIZED", "Sign in to create an API token.");
  }
  const limited = await enforceRateLimit({
    namespace: "token-create",
    identifier: session.user.id,
    limit: 10,
    windowSeconds: 3600,
  });
  if (limited) return limited;

  const token = nanoid(32);
  const id = nanoid();

  await db.insert(apiTokens).values({
    id,
    userId: session.user.id,
    tokenHash: hashApiToken(token),
    tokenPrefix: tokenPrefix(token),
  });

  return NextResponse.json({ token }, { status: 201 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await db
    .select({
      id: apiTokens.id,
      tokenPrefix: apiTokens.tokenPrefix,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, session.user.id))
    .orderBy(apiTokens.createdAt);

  return NextResponse.json({ tokens });
}
