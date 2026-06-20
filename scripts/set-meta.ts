import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../lib/schema.js";
import { eq } from "drizzle-orm";
const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
async function main() {
  await db.update(schema.contracts)
    .set({
      description: "The Contrakt registry's own API — search, publish, and fetch machine-readable API contracts that AI agents can call.",
      featured: true,
    })
    .where(eq(schema.contracts.slug, "shouryasrivastava/contrakt-registry"));
  console.log("✓ description + featured set");
}
main().catch(e => { console.error(e); process.exit(1); });
