import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, apiTokens, users } from "@/lib/schema";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

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
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  // Validate token
  const tokenRow = await db.query.apiTokens.findFirst({
    where: eq(apiTokens.token, token),
    with: { userId: true },
  });

  if (!tokenRow) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, tokenRow.userId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  let body: { name?: unknown; contract?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json(
      { error: "Missing required field: name" },
      { status: 400 }
    );
  }

  if (!body.contract || typeof body.contract !== "object") {
    return NextResponse.json(
      { error: "Missing required field: contract" },
      { status: 400 }
    );
  }

  const contractData = body.contract as Record<string, unknown>;
  const slugifiedName = slugify(body.name);
  const slug = `${user.username}/${slugifiedName}`;

  const endpoints = Array.isArray(contractData.endpoints)
    ? contractData.endpoints
    : [];
  const endpointCount = endpoints.length;
  const stack =
    typeof contractData.stack === "string" ? contractData.stack : null;

  const existingContract = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });

  let contractId: string;

  if (existingContract) {
    await db
      .update(contracts)
      .set({
        contract: contractData,
        endpointCount,
        stack,
        updatedAt: new Date(),
      })
      .where(eq(contracts.slug, slug));
    contractId = existingContract.id;
  } else {
    contractId = nanoid();
    await db.insert(contracts).values({
      id: contractId,
      userId: user.id,
      name: slugifiedName,
      slug,
      contract: contractData,
      endpointCount,
      stack,
    });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://registry.contrakt.dev";
  const url = `${appUrl}/c/${slug}`;

  return NextResponse.json({ id: contractId, url, slug }, { status: 200 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const stack = searchParams.get("stack") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

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
