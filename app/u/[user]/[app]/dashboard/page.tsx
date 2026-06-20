import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import {
  ArrowRight,
  CircleDollarSign,
  GitBranch,
  RadioTower,
  UsersRound,
} from "lucide-react";
import { db } from "@/lib/db";
import { getOwnedContract } from "@/lib/owner-contract-data";
import {
  contractDependencies,
  contractVersions,
  freeTierUsage,
  monetizationConfigs,
  paymentReceipts,
} from "@/lib/schema";
import OwnerConsoleShell from "@/app/components/OwnerConsoleShell";

interface PageProps {
  params: Promise<{ user: string; app: string }>;
}

type DiffSummary = {
  breaking?: unknown[];
  nonBreaking?: unknown[];
  additive?: unknown[];
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof RadioTower;
}) {
  return (
    <div className="metric-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">{label}</p>
        <Icon className="h-4 w-4 text-muted" />
      </div>
      <p className="mt-5 text-[30px] leading-none tracking-[-0.03em] text-ink">{value}</p>
      <p className="mt-2 text-[11px] text-muted">{note}</p>
    </div>
  );
}

export default async function ApiOverviewPage({ params }: PageProps) {
  const { user, app } = await params;
  const { session, contract, slug } = await getOwnedContract(user, app);

  const [dependencyCountRow, monetization, versions, receiptRow, freeCallRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contractDependencies)
      .where(eq(contractDependencies.contractId, contract.id)),
    db.query.monetizationConfigs.findFirst({
      where: eq(monetizationConfigs.contractId, contract.id),
    }),
    db
      .select()
      .from(contractVersions)
      .where(eq(contractVersions.contractId, contract.id))
      .orderBy(desc(contractVersions.version))
      .limit(8),
    db
      .select({
        calls: sql<number>`count(*)::int`,
        rawUsdc: sql<string>`coalesce(sum(${paymentReceipts.amountUsdc}::numeric), 0)::text`,
      })
      .from(paymentReceipts)
      .innerJoin(monetizationConfigs, eq(monetizationConfigs.id, paymentReceipts.monetizationConfigId))
      .where(eq(monetizationConfigs.contractId, contract.id)),
    db
      .select({ calls: sql<number>`coalesce(sum(${freeTierUsage.callCount}), 0)::int` })
      .from(freeTierUsage)
      .innerJoin(monetizationConfigs, eq(monetizationConfigs.id, freeTierUsage.monetizationConfigId))
      .where(eq(monetizationConfigs.contractId, contract.id)),
  ]);

  const dependencyCount = dependencyCountRow[0]?.count ?? 0;
  const receipts = receiptRow[0] ?? { calls: 0, rawUsdc: "0" };
  const freeCalls = freeCallRow[0]?.calls ?? 0;
  const totalUsdc = Number(receipts.rawUsdc) / 1_000_000;

  return (
    <OwnerConsoleShell
      active="overview"
      session={session}
      slug={slug}
      appName={contract.name}
      endpointCount={contract.endpointCount}
      action={
        <Link href={`/u/${slug}`} className="rounded-full border border-ink px-4 py-2 text-[13px] font-medium text-ink">
          Public page
        </Link>
      }
    >
      <div className="p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Published contract</p>
            </div>
            <h1 className="mt-2 text-[34px] leading-none text-ink">{contract.name}</h1>
            <p className="mt-2 text-[13px] text-muted">{contract.description ?? contract.slug}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Last published</p>
            <p className="mt-1 text-[12px] text-ink">{formatDate(contract.updatedAt)}</p>
          </div>
        </div>

        {!contract.baseUrl ? (
          <section className="mt-6 flex flex-col justify-between gap-4 rounded-[12px] border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-amber-800">Setup required</p>
              <h2 className="mt-1 text-[18px] text-ink">Add the API deployment URL</h2>
              <p className="mt-1 text-[12px] leading-5 text-amber-900">
                Agents need a live base URL to call these endpoints. Use a complete address such as https://api.example.com.
              </p>
            </div>
            <Link
              href={`/u/${slug}/dashboard/integrations#deployment`}
              prefetch
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[12px] font-medium text-white"
            >
              Add deployment URL <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Endpoints" value={`${contract.endpointCount}`} note={contract.stack ?? "Unknown stack"} icon={RadioTower} />
          <Metric label="Consumers" value={`${dependencyCount}`} note="Declared downstream projects" icon={UsersRound} />
          <Metric label="Verified calls" value={`${receipts.calls + freeCalls}`} note={`${receipts.calls} paid · ${freeCalls} free`} icon={GitBranch} />
          <Metric
            label="USDC received"
            value={totalUsdc.toLocaleString("en-US", { maximumFractionDigits: 6 })}
            note={monetization?.enabled ? `$${monetization.priceUsd} per paid call` : "Monetization is off"}
            icon={CircleDollarSign}
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
          <section className="overflow-hidden rounded-[12px] border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-[20px] text-ink">Publish history</h2>
                <p className="mt-1 text-[11px] text-muted">Immutable snapshots created by each CLI publish.</p>
              </div>
              <span className="font-mono text-[10px] text-faint">{versions.length} versions</span>
            </div>
            {versions.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-muted">
                Publish again to start version history for this existing contract.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {versions.map((version) => {
                  const diff = (version.diff ?? {}) as DiffSummary;
                  const breaking = diff.breaking?.length ?? 0;
                  const nonBreaking = diff.nonBreaking?.length ?? 0;
                  const additive = diff.additive?.length ?? 0;
                  return (
                    <div key={version.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:items-center">
                      <p className="font-mono text-[11px] font-semibold text-ink">v{version.version}</p>
                      <div>
                        <p className="text-[12px] text-ink">{version.endpointCount} endpoints</p>
                        <p className="mt-1 text-[10px] text-faint">{formatDate(version.publishedAt)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[9px] font-medium uppercase tracking-[0.1em]">
                        {breaking ? <span className="rounded-full bg-red-50 px-2 py-1 text-red-600">{breaking} breaking</span> : null}
                        {nonBreaking ? <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">{nonBreaking} safe</span> : null}
                        {additive ? <span className="rounded-full bg-[#f2f2f2] px-2 py-1 text-muted">{additive} docs</span> : null}
                        {!breaking && !nonBreaking && !additive ? <span className="text-faint">Initial snapshot</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[12px] border border-border bg-white p-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Production deployment</p>
            <h2 className="mt-3 text-[20px] text-ink">{contract.baseUrl ? "Ready for agents" : "URL required"}</h2>
            <p className="mt-2 break-all font-mono text-[11px] leading-5 text-muted">
              {contract.baseUrl ?? "Add the running API URL before sharing MCP configuration."}
            </p>
            <Link
              href={`/u/${slug}/dashboard/integrations#deployment`}
              prefetch
              className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold text-ink"
            >
              Configure integrations <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </div>
      </div>
    </OwnerConsoleShell>
  );
}
