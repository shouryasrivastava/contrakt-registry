import Link from "next/link";
import { unstable_cache } from "next/cache";
import { e2eEnabled } from "@/lib/e2e";
import { desc } from "drizzle-orm";
import { databaseRead, db } from "@/lib/db";
import { signInPath } from "@/lib/access";
import { contracts } from "@/lib/schema";
import ContractSearch from "../components/ContractSearch";
import { FloatingNav, WorkspaceLayout } from "../components/WorkspaceChrome";
import ConnectWalletButton from "../components/ConnectWalletButton";
import AccountAvatar from "../components/AccountAvatar";
import ProfileMenu from "../components/ProfileMenu";
import PublicRegistrySidebar from "../components/PublicRegistrySidebar";
import DataUnavailable from "../components/DataUnavailable";
import { auth } from "@/lib/auth";

const loadRegistryContracts = async () => {
  const rows = await databaseRead(() =>
    db.query.contracts.findMany({
      orderBy: [desc(contracts.updatedAt)],
    })
  );
  globalThis.__contraktRegistryRows = rows;
  return rows;
};

const getCachedRegistryContracts = unstable_cache(
  loadRegistryContracts,
  ["registry-contracts"],
  { revalidate: 30 }
);

async function getRegistryContracts() {
  return e2eEnabled() ? loadRegistryContracts() : getCachedRegistryContracts();
}

interface RegistryPageProps {
  searchParams?: Promise<{
    q?: string;
    stack?: string;
    sort?: string;
  }>;
}

declare global {
  // Survives hot reloads in local dev and protects navigation from brief Neon/DNS outages.
  var __contraktRegistryRows: Awaited<ReturnType<typeof db.query.contracts.findMany>> | undefined;
}

export default async function RegistryPage({ searchParams }: RegistryPageProps) {
  const [params, session] = await Promise.all([
    Promise.resolve(searchParams).then((value) => value ?? {}),
    auth(),
  ]);
  const q = params.q?.trim().toLowerCase() ?? "";
  const stack = params.stack?.trim().toLowerCase() ?? "";

  let rows;
  let degraded = false;
  try {
    rows = await getRegistryContracts();
  } catch {
    rows = globalThis.__contraktRegistryRows;
    degraded = Boolean(rows);
    if (!rows) {
      return (
        <DataUnavailable
          retryHref="/registry"
          title="Public registry is temporarily unavailable"
          message="Contrakt could not load live contract data. No placeholder contracts are being shown."
        />
      );
    }
  }

  const filtered = rows.filter((row) => {
    const haystack = `${row.slug} ${row.name}`.toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (stack && !(row.stack ?? "").toLowerCase().includes(stack)) return false;
    return true;
  });

  const dashboardHref = session?.user ? "/dashboard" : signInPath("/dashboard");
  return (
    <div className="min-h-screen bg-background px-3 pb-10 pt-6 sm:px-5">
      <div className="mx-auto max-w-[1320px]">
        <FloatingNav
          apisHref={dashboardHref}
          actions={
            <>
              <Link href={dashboardHref} className="hidden rounded-full border border-[#202020] bg-transparent px-5 py-2 text-[13px] font-medium text-[#202020] sm:inline-flex">
                Publish API
              </Link>
              <ConnectWalletButton />
              {session?.user ? (
                <ProfileMenu
                  image={session.user.image}
                  name={session.user.name}
                  username={session.user.username}
                  email={session.user.email}
                />
              ) : (
                <AccountAvatar name="Guest" />
              )}
            </>
          }
        />
      </div>

      <main className="pt-6">
        <WorkspaceLayout
          sidebar={<PublicRegistrySidebar dashboardHref={dashboardHref} />}
        >
          <div className="px-6 py-6">
            {degraded ? (
              <div className="mb-5 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
                Showing the last available registry data while the live database reconnects.
              </div>
            ) : null}
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h1 className="display-title text-[#202020]">Public Registry</h1>
                <p className="mt-2 max-w-2xl text-[14px] text-[#6b6b6b]">
                  Discover published agent-ready contracts, inspect MCP-ready endpoints, and open live contract pages.
                </p>
              </div>
              <div className="rounded-full border border-border bg-white px-3 py-1.5 shadow-[0_1px_3px_rgba(32,32,32,0.04)]">
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#202020]">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  {filtered.length} Contracts
                </span>
              </div>
            </div>

            <div className="soft-panel p-5">
              <ContractSearch initialQ={params.q ?? ""} initialStack={params.stack ?? ""} initialSort={params.sort ?? "recent"} />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/u/${contract.slug}`}
                  className="soft-panel flex min-h-[220px] flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-[#fcfcfc]"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#fff4ef] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                        <span className="h-2 w-2 rounded-full bg-accent" />
                        Live
                      </span>
                      {contract.stack ? (
                        <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                          {contract.stack}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#8a8a8a]">Registry</p>
                    <h2 className="mt-2 text-[28px] leading-[1] tracking-[-0.03em] text-[#202020]">{contract.name}</h2>
                    <p className="mt-3 text-[13px] text-[#6b6b6b]">{contract.slug}</p>
                    <p className="mt-5 text-[14px] leading-[1.5] text-[#5f5e5e]">
                      {contract.endpointCount} endpoint{contract.endpointCount === 1 ? "" : "s"} ready for MCP clients and agent workflows.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-[13px] font-medium text-[#202020]">
                    <span>Open contract</span>
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </WorkspaceLayout>
      </main>
    </div>
  );
}
