import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { ArrowUpRight, CircleDollarSign, RadioTower, UsersRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  contractDependencies,
  contracts,
  monetizationConfigs,
  paymentReceipts,
  users,
} from "@/lib/schema";
import { REGISTRY_URL } from "@/lib/site";
import { signInPath } from "@/lib/access";
import { getX402Network } from "@/lib/x402";
import FloatingPublicNav from "@/app/components/PublicContractNav";
import CodeBlock from "@/app/components/CodeBlock";
import EndpointCard from "@/app/components/EndpointCard";
import DataUnavailable from "@/app/components/DataUnavailable";

interface PageProps {
  params: Promise<{ user: string; app: string }>;
}

interface RawEndpoint {
  method?: string;
  path?: string;
  description?: string;
  statusCodes?: (string | number)[];
  responses?: Record<string, unknown>;
}

interface ContractData {
  endpoints?: RawEndpoint[];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { user, app } = await params;
  return {
    title: `${user}/${app} — Contrakt`,
    description: `Machine-readable API contract for ${user}/${app}.`,
  };
}

function statusCodesOf(endpoint: RawEndpoint): string[] {
  if (endpoint.statusCodes?.length) return endpoint.statusCodes.map(String);
  return endpoint.responses ? Object.keys(endpoint.responses) : [];
}

function buildCurl(method: string, path: string, baseUrl: string): string {
  const lines = [`curl -X ${method.toUpperCase()} ${baseUrl}${path}`];
  if (!["GET", "DELETE"].includes(method.toUpperCase())) {
    lines.push(`  -H "Content-Type: application/json"`, `  -d '{ }'`);
  }
  return lines.join(" \\\n");
}

export default async function PublicContractPage({ params }: PageProps) {
  const { user, app } = await params;
  const slug = `${user}/${app}`;
  let result;
  let session;
  try {
    [result, session] = await Promise.all([
      db
        .select({
          contract: contracts,
          username: users.username,
          monetization: monetizationConfigs,
          consumers: sql<number>`(
            select count(*)::int from ${contractDependencies}
            where ${contractDependencies.contractId} = ${contracts.id}
          )`,
          paidCalls: sql<number>`(
            select count(*)::int
            from ${paymentReceipts}
            inner join ${monetizationConfigs} as receipt_config
              on receipt_config.id = ${paymentReceipts.monetizationConfigId}
            where receipt_config.contract_id = ${contracts.id}
          )`,
        })
        .from(contracts)
        .leftJoin(users, eq(users.id, contracts.userId))
        .leftJoin(monetizationConfigs, eq(monetizationConfigs.contractId, contracts.id))
        .where(eq(contracts.slug, slug))
        .limit(1),
      auth(),
    ]);
  } catch {
    return <DataUnavailable retryHref={`/u/${slug}`} />;
  }
  const row = result[0];
  if (!row) notFound();

  const contractData = row.contract.contract as ContractData;
  const endpoints = contractData.endpoints ?? [];
  const isOwner = session?.user?.id === row.contract.userId;
  const dashboardHref = isOwner ? `/u/${slug}/dashboard` : signInPath(`/u/${slug}/dashboard`);
  const publicUrl = `${REGISTRY_URL}/u/${slug}`;
  const mcpUrl = `${REGISTRY_URL}/api/registry/contracts/${slug}/mcp`;
  const watchCommand = `contrakt watch ${publicUrl} --depend`;
  const badgeMarkdown = `[![Contrakt API](${REGISTRY_URL}/badge/${slug})](${publicUrl})`;
  const network = getX402Network();
  const baseUrl = row.contract.baseUrl ?? "https://your-app.example";

  return (
    <div className="min-h-screen bg-background px-3 pb-14 pt-5 sm:px-5">
      <FloatingPublicNav dashboardHref={dashboardHref} />
      <main className="mx-auto mt-5 w-full max-w-[1120px]">
        <section className="border-b border-border py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em]">
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">Published</span>
                <span className="rounded-full bg-[#f2f2f2] px-2.5 py-1 text-muted">
                  {row.monetization?.enabled ? "Paid API" : "Free API"}
                </span>
              </div>
              <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.8rem)] leading-[0.9] tracking-[-0.04em] text-ink">
                {row.contract.name}
              </h1>
              <p className="mt-5 max-w-[680px] text-[15px] leading-7 text-muted">
                {row.contract.description ?? `A machine-readable ${row.contract.stack ?? "API"} contract published by @${row.username ?? user}.`}
              </p>
            </div>
            <div className="border-l border-border pl-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Production endpoint</p>
              <p className="mt-2 break-all font-mono text-[11px] leading-5 text-ink">
                {row.contract.baseUrl ?? "Publisher has not configured a production URL."}
              </p>
              {isOwner ? (
                <Link
                  href={`/u/${slug}/dashboard/integrations`}
                  className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-ink underline"
                >
                  Configure deployment <ArrowUpRight className="h-3 w-3" />
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid gap-3 border-b border-border py-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <RadioTower className="h-4 w-4 text-muted" />
            <p className="text-[12px] text-muted"><strong className="text-ink">{row.contract.endpointCount}</strong> endpoints</p>
          </div>
          <div className="flex items-center gap-3">
            <UsersRound className="h-4 w-4 text-muted" />
            <p className="text-[12px] text-muted"><strong className="text-ink">{row.consumers}</strong> declared consumers</p>
          </div>
          <div className="flex items-center gap-3">
            <CircleDollarSign className="h-4 w-4 text-muted" />
            <p className="text-[12px] text-muted">
              <strong className="text-ink">{row.paidCalls}</strong> verified paid calls
            </p>
          </div>
        </div>

        <div className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <div>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent">Contract surface</p>
                <h2 className="mt-2 text-[27px] text-ink">Endpoints</h2>
              </div>
              <span className="font-mono text-[10px] text-faint">{endpoints.length} operations</span>
            </div>
            <div className="space-y-2">
              {endpoints.length ? (
                endpoints.map((endpoint, index) => {
                  const method = endpoint.method ?? "GET";
                  const path = endpoint.path ?? "/";
                  return (
                    <EndpointCard
                      key={`${method}-${path}-${index}`}
                      method={method}
                      path={path}
                      description={endpoint.description}
                      statusCodes={statusCodesOf(endpoint)}
                      priceUsd={row.monetization?.enabled ? row.monetization.priceUsd : null}
                      curl={buildCurl(method, path, baseUrl)}
                    />
                  );
                })
              ) : (
                <div className="rounded-[10px] border border-border bg-white px-5 py-10 text-center text-[12px] text-muted">
                  This contract does not expose any inferred endpoints.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[12px] border border-border bg-white p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Agent access</p>
              <h2 className="mt-3 text-[20px] text-ink">MCP configuration</h2>
              <p className="mt-2 text-[12px] leading-5 text-muted">Generate tools from this contract and proxy calls to the configured deployment.</p>
              <CodeBlock lang="bash" title="Fetch MCP config" code={`curl ${mcpUrl}`} className="mt-4" />
            </section>

            <section className="rounded-[12px] border border-border bg-white p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Pricing</p>
              <p className="mt-3 text-[24px] text-ink">
                {row.monetization?.enabled ? `${row.monetization.priceUsd} USDC` : "Free"}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {row.monetization?.enabled
                  ? `${row.monetization.freeTierCalls} free calls per agent, then paid on ${network.name}.`
                  : "No payment is required by the registry."}
              </p>
            </section>

            <section className="rounded-[12px] border border-border bg-white p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Track changes</p>
              <CodeBlock lang="bash" title="Watch and declare dependency" code={watchCommand} className="mt-3" />
              <CodeBlock lang="text" title="README badge" code={badgeMarkdown} className="mt-3" />
              <Link
                href={`/api/registry/contracts/${slug}`}
                className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-ink underline"
              >
                Open raw contract <ArrowUpRight className="h-3 w-3" />
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
