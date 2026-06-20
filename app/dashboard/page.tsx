import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { ArrowRight, Boxes, CircleDollarSign, GitFork, RadioTower, UsersRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/access";
import { db } from "@/lib/db";
import {
  apiTokens,
  contractDependencies,
  contracts,
  monetizationConfigs,
  paymentReceipts,
} from "@/lib/schema";
import OwnerConsoleShell from "../components/OwnerConsoleShell";
import PublishApiButton from "../components/PublishApiButton";

function formatUsdc(raw: string | null): string {
  return (Number(raw ?? 0) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function Metric({
  label,
  value,
  icon: Icon,
  note,
}: {
  label: string;
  value: string;
  icon: typeof Boxes;
  note: string;
}) {
  return (
    <div className="metric-panel min-h-[138px]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-[9px] bg-[#f2f2f2]">
          <Icon className="h-4 w-4 text-ink" />
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">{label}</p>
      </div>
      <p className="mt-5 text-[31px] leading-none tracking-[-0.03em] text-ink">{value}</p>
      <p className="mt-2 text-[11px] text-muted">{note}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  requireSession(session, "/dashboard");

  const rows = await db
    .select()
    .from(contracts)
    .where(eq(contracts.userId, session.user.id))
    .orderBy(desc(contracts.updatedAt));
  const ids = rows.map((row) => row.id);
  const tokens = await db
    .select({
      id: apiTokens.id,
      tokenPrefix: apiTokens.tokenPrefix,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, session.user.id))
    .orderBy(desc(apiTokens.createdAt));

  const dependencyRows = ids.length
    ? await db
        .select({
          contractId: contractDependencies.contractId,
          count: sql<number>`count(*)::int`,
        })
        .from(contractDependencies)
        .where(inArray(contractDependencies.contractId, ids))
        .groupBy(contractDependencies.contractId)
    : [];
  const monetizationRows = ids.length
    ? await db
        .select()
        .from(monetizationConfigs)
        .where(inArray(monetizationConfigs.contractId, ids))
    : [];
  const configIds = monetizationRows.map((row) => row.id);
  const receiptTotals = configIds.length
    ? await db
        .select({
          paidCalls: sql<number>`count(*)::int`,
          rawUsdc: sql<string>`coalesce(sum(${paymentReceipts.amountUsdc}::numeric), 0)::text`,
        })
        .from(paymentReceipts)
        .where(inArray(paymentReceipts.monetizationConfigId, configIds))
    : [{ paidCalls: 0, rawUsdc: "0" }];

  const dependencyByContract = new Map(dependencyRows.map((row) => [row.contractId, row.count]));
  const monetizationByContract = new Map(monetizationRows.map((row) => [row.contractId, row]));
  const endpointCount = rows.reduce((sum, row) => sum + row.endpointCount, 0);
  const consumerCount = dependencyRows.reduce((sum, row) => sum + row.count, 0);
  const totals = receiptTotals[0] ?? { paidCalls: 0, rawUsdc: "0" };

  return (
    <OwnerConsoleShell
      active="portfolio"
      session={session}
      action={<PublishApiButton tokens={tokens} />}
    >
      <div className="p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Publisher console</p>
            <h1 className="mt-2 text-[34px] leading-none text-ink">My APIs</h1>
            <p className="mt-2 text-[13px] text-muted">Publish contracts, track consumers, and configure agent access.</p>
          </div>
          <PublishApiButton tokens={tokens} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Published APIs" value={`${rows.length}`} icon={Boxes} note="Contracts in the registry" />
          <Metric label="Endpoints" value={`${endpointCount}`} icon={RadioTower} note="Machine-readable operations" />
          <Metric label="Consumers" value={`${consumerCount}`} icon={UsersRound} note="Declared dependencies" />
          <Metric
            label="Verified revenue"
            value={`${formatUsdc(totals.rawUsdc)} USDC`}
            icon={CircleDollarSign}
            note={`${totals.paidCalls} verified paid call${totals.paidCalls === 1 ? "" : "s"}`}
          />
        </div>

        <section className="mt-6 overflow-hidden rounded-[12px] border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-[20px] text-ink">Published contracts</h2>
              <p className="mt-1 text-[11px] text-muted">The current source of truth for your public APIs.</p>
            </div>
            <Link href="/registry" className="inline-flex items-center gap-2 text-[12px] font-medium text-ink">
              Public registry <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {rows.length === 0 ? (
            <div className="grid min-h-[300px] place-items-center px-5 py-12 text-center">
              <div className="max-w-[450px]">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-[12px] bg-[#f2f2f2]">
                  <GitFork className="h-5 w-5 text-ink" />
                </div>
                <h3 className="mt-4 text-[22px] text-ink">Publish your first contract</h3>
                <p className="mt-2 text-[13px] leading-6 text-muted">
                  Contrakt infers your routes locally. Your lockfile stays in your repository; the registry receives the
                  published contract and its version history.
                </p>
                <div className="mt-5">
                  <PublishApiButton tokens={tokens} />
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((row) => {
                const monetization = monetizationByContract.get(row.id);
                return (
                  <div
                    key={row.id}
                    className="grid gap-4 px-5 py-4 transition-colors hover:bg-[#fafafa] md:grid-cols-[minmax(0,1.4fr)_0.5fr_0.6fr_0.7fr_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <Link href={`/u/${row.slug}/dashboard`} prefetch className="truncate text-[14px] font-semibold text-ink hover:underline">
                        {row.name}
                      </Link>
                      <p className="mt-1 truncate font-mono text-[10px] text-faint">{row.slug}</p>
                    </div>
                    <p className="text-[12px] text-muted">{row.endpointCount} endpoints</p>
                    <p className="text-[12px] text-muted">{dependencyByContract.get(row.id) ?? 0} consumers</p>
                    <Link
                      href={`/u/${row.slug}/dashboard/integrations#deployment`}
                      prefetch
                      className="flex items-center gap-2 text-[11px] hover:underline"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${row.baseUrl ? "bg-green-500" : "bg-amber-400"}`} />
                      <span className="text-muted">{row.baseUrl ? "Deployment set" : "Needs deployment URL"}</span>
                    </Link>
                    <span className="rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-ink">
                      {monetization?.enabled ? `$${monetization.priceUsd} / call` : "Free"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </OwnerConsoleShell>
  );
}
