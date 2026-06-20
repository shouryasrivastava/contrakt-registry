import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ExternalLink, UsersRound } from "lucide-react";
import { db } from "@/lib/db";
import { getOwnedContract } from "@/lib/owner-contract-data";
import { contractDependencies, users } from "@/lib/schema";
import OwnerConsoleShell from "@/app/components/OwnerConsoleShell";
import CopyButton from "@/app/components/CopyButton";

interface PageProps {
  params: Promise<{ user: string; app: string }>;
}

export default async function ConsumersPage({ params }: PageProps) {
  const { user, app } = await params;
  const { session, contract, slug } = await getOwnedContract(user, app);
  const dependencies = await db
    .select({
      id: contractDependencies.id,
      consumerName: contractDependencies.consumerName,
      consumerUrl: contractDependencies.consumerUrl,
      createdAt: contractDependencies.createdAt,
      lastSeenAt: contractDependencies.lastSeenAt,
      username: users.username,
    })
    .from(contractDependencies)
    .leftJoin(users, eq(users.id, contractDependencies.userId))
    .where(eq(contractDependencies.contractId, contract.id))
    .orderBy(desc(contractDependencies.lastSeenAt));
  const publicUrl = `https://registry.contrakt.dev/u/${slug}`;
  const watchCommand = `contrakt watch ${publicUrl} --depend`;

  return (
    <OwnerConsoleShell
      active="consumers"
      session={session}
      slug={slug}
      appName={contract.name}
      endpointCount={contract.endpointCount}
    >
      <div className="p-5 sm:p-7">
        <div className="border-b border-border pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Dependency graph</p>
          <h1 className="mt-2 text-[34px] leading-none text-ink">Consumers</h1>
          <p className="mt-2 text-[13px] text-muted">Projects that declared a dependency on this contract.</p>
        </div>

        <section className="mt-6 overflow-hidden rounded-[12px] border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-[20px] text-ink">{dependencies.length} declared consumers</h2>
              <p className="mt-1 text-[11px] text-muted">These projects can be affected by a breaking publish.</p>
            </div>
            <UsersRound className="h-4 w-4 text-muted" />
          </div>
          {dependencies.length ? (
            <div className="divide-y divide-border">
              {dependencies.map((dependency) => (
                <div key={dependency.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_0.7fr_0.7fr_auto] md:items-center">
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{dependency.consumerName}</p>
                    <p className="mt-1 text-[11px] text-muted">by {dependency.username ?? "Contrakt user"}</p>
                  </div>
                  <p className="text-[11px] text-muted">Added {dependency.createdAt.toLocaleDateString()}</p>
                  <p className="text-[11px] text-muted">Seen {dependency.lastSeenAt.toLocaleDateString()}</p>
                  {dependency.consumerUrl ? (
                    <Link
                      href={dependency.consumerUrl}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-ink"
                    >
                      Repository <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-[11px] text-faint">No repository</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-[280px] place-items-center px-5 py-10 text-center">
              <div className="max-w-[520px]">
                <h3 className="text-[21px] text-ink">No declared consumers yet</h3>
                <p className="mt-2 text-[13px] leading-6 text-muted">
                  Consumers declare themselves when they watch this contract. Share the command below in your API docs.
                </p>
                <div className="mt-5 flex items-center gap-3 rounded-[10px] bg-[#171717] px-4 py-3 text-left text-white">
                  <code className="min-w-0 flex-1 truncate text-[11px]">{watchCommand}</code>
                  <CopyButton text={watchCommand} className="text-white/70 hover:text-white" />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </OwnerConsoleShell>
  );
}
