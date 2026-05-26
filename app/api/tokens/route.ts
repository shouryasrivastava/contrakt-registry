import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(_req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = nanoid(32);
  const id = nanoid();

  await db.insert(apiTokens).values({
    id,
    userId: session.user.id,
    token,
  });

  return NextResponse.json({ token }, { status: 201 });
}

export async function GET(_req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await db
    .select({
      id: apiTokens.id,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, session.user.id))
    .orderBy(apiTokens.createdAt);

  return NextResponse.json({ tokens });
}
