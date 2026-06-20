/**
 * Throwaway helper: find or create an API token for the owner of a given
 * contract slug, so we can test `contrakt monetize --publish` locally.
 *
 * Usage: npx tsx scripts/get-token.ts <username>/<app>
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../lib/schema.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx scripts/get-token.ts <username>/<app>");
    process.exit(1);
  }

  const contract = await db.query.contracts.findFirst({
    where: eq(schema.contracts.slug, slug),
  });
  if (!contract) {
    console.error(`No contract found with slug ${slug}`);
    process.exit(1);
  }

  const token = await db.query.apiTokens.findFirst({
    where: eq(schema.apiTokens.userId, contract.userId),
  });

  if (!token) {
    const newToken = `ck_${nanoid(32)}`;
    await db.insert(schema.apiTokens).values({
      id: nanoid(),
      userId: contract.userId,
      token: newToken,
    });
    console.log(newToken);
  } else {
    console.log(token.token);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
