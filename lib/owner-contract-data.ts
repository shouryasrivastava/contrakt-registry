import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { requireOwner, requireSession } from "./access";
import { db } from "./db";
import { contracts } from "./schema";

export async function getOwnedContract(
  user: string,
  app: string,
  nextPath?: string,
) {
  const slug = `${user}/${app}`;
  const session = await auth();
  requireSession(session, nextPath ?? `/u/${slug}/dashboard`);
  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });
  if (!contract) notFound();
  requireOwner(session, contract.userId, `/u/${slug}`);
  return { session, contract, slug };
}
