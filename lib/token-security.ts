import { createHash, timingSafeEqual } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "./db";
import { apiTokens } from "./schema";

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenPrefix(token: string): string {
  return token.slice(0, 8);
}

export async function resolveApiToken(token: string) {
  const hash = hashApiToken(token);
  const hashed = await db.query.apiTokens.findFirst({
    where: and(eq(apiTokens.tokenHash, hash), isNotNull(apiTokens.tokenHash)),
  });
  if (hashed) return hashed;

  const legacy = await db.query.apiTokens.findFirst({
    where: eq(apiTokens.token, token),
  });
  if (!legacy) return null;

  await db
    .update(apiTokens)
    .set({
      token: null,
      tokenHash: hash,
      tokenPrefix: tokenPrefix(token),
    })
    .where(eq(apiTokens.id, legacy.id));

  return { ...legacy, token: null, tokenHash: hash, tokenPrefix: tokenPrefix(token) };
}

export function tokenMatches(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashApiToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
