"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Search, Star } from "lucide-react";

const githubUrl = "https://github.com/shouryasrivastava/contrakt";
const REGISTRY_ORIGIN = process.env.NEXT_PUBLIC_REGISTRY_URL || "https://registry.contrakt.dev";
const githubLoginHref = `${REGISTRY_ORIGIN}/sign-in?next=${encodeURIComponent("/dashboard")}`;
const mono = "'JetBrains Mono', 'DM Mono', monospace";

type LiveContract = {
  slug: string;
  name: string;
  description?: string | null;
  stack?: string | null;
  endpointCount?: number | null;
  updatedAt?: string | null;
  registryUrl?: string;
  mcpConfigUrl?: string;
};

function DarkRegistryNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#23252a]/80 bg-[#08090a]/85 backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/contrakt-logo-white.png" alt="Contrakt" width={34} height={34} />
          <span className="text-[24px] font-bold leading-none tracking-[-0.55px] text-[#f7f8f8]">Contrakt</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          <a href={`${githubUrl}#readme`} className="text-[13px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]">Docs</a>
          <Link href="/registry" className="text-[13px] text-[#f36127]">Registry</Link>
          <a href={githubUrl} className="text-[13px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]">GitHub</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href={githubLoginHref} className="hidden text-[13px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8] sm:block">Login</a>
          <a href={githubLoginHref} className="rounded-md bg-[#f36127] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
            Continue with GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

function stackLabel(stack?: string | null) {
  if (!stack) return "Unknown stack";
  return stack.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).replace("Nextjs", "Next.js");
}

function formatDate(value?: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function RegistryPage() {
  const [contracts, setContracts] = useState<LiveContract[]>([]);
  const [query, setQuery] = useState("");
  const [activeStack, setActiveStack] = useState("All");
  const [sort, setSort] = useState<"recent" | "endpoints" | "name">("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/registry/search?limit=50", {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Live registry data unavailable");
        setContracts(Array.isArray(data.contracts) ? data.contracts : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          setContracts([]);
          setError(err instanceof Error ? err.message : "Live registry data unavailable");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  const stacks = useMemo(() => {
    const values = Array.from(new Set(contracts.map((contract) => contract.stack).filter(Boolean))) as string[];
    return ["All", ...values.sort()];
  }, [contracts]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return contracts
      .filter((contract) => {
        const matchesQuery =
          !normalizedQuery ||
          contract.name.toLowerCase().includes(normalizedQuery) ||
          contract.slug.toLowerCase().includes(normalizedQuery) ||
          (contract.description ?? "").toLowerCase().includes(normalizedQuery);
        const matchesStack = activeStack === "All" || contract.stack === activeStack;
        return matchesQuery && matchesStack;
      })
      .sort((a, b) => {
        if (sort === "endpoints") return (b.endpointCount ?? 0) - (a.endpointCount ?? 0);
        if (sort === "name") return a.name.localeCompare(b.name);
        return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
      });
  }, [activeStack, contracts, query, sort]);

  const totalEndpoints = contracts.reduce((sum, contract) => sum + (contract.endpointCount ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#08090a] font-sans text-[#f7f8f8] antialiased">
      <DarkRegistryNav />

      <section className="relative overflow-hidden border-b border-[#23252a] px-6 pt-[60px]">
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle, rgba(243,97,39,0.16) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#08090a] to-transparent" />
        <div className="relative mx-auto max-w-[900px] py-20 text-center">
          <p className="mb-5 text-[12px] uppercase tracking-widest text-[#f36127]" style={{ fontFamily: mono }}>registry.contrakt.dev</p>
          <h1 className="mx-auto mb-5 max-w-[760px] text-[clamp(44px,7vw,72px)] font-light leading-none tracking-[-1.2px] text-[#f7f8f8]">
            Browse live API contracts.
          </h1>
          <p className="mx-auto mb-10 max-w-[560px] text-[17px] leading-[1.6] text-[#8a8f98]">
            Discover published contracts, inspect endpoint shapes, and connect agents to APIs with MCP metadata.
          </p>
          <div className="mx-auto mb-8 flex max-w-[520px] items-center justify-center gap-6 text-[13px] text-[#62666d]" style={{ fontFamily: mono }}>
            <span><span className="text-[#f7f8f8]">{contracts.length}</span> contracts</span>
            <span><span className="text-[#f7f8f8]">{totalEndpoints.toLocaleString()}</span> endpoints</span>
            <span><span className="text-[#f36127]">live</span> registry</span>
          </div>
          <div className="relative mx-auto max-w-[680px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#62666d]" />
            <input
              type="text"
              placeholder="Search by contract name, owner, or description..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl border border-[#23252a] bg-[#0f1011] py-4 pl-11 pr-5 text-sm text-[#f7f8f8] shadow-[inset_0_0_0_1px_rgba(35,37,42,0.7)] outline-none transition-all placeholder:text-[#4a4d55] focus:border-[#f36127] focus:ring-2 focus:ring-[#f36127]/15"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#23252a] pb-6 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {stacks.map((stack) => (
              <button
                key={stack}
                type="button"
                onClick={() => setActiveStack(stack)}
                className={`rounded-md border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeStack === stack ? "border-[#f36127] bg-[#f36127] text-white" : "border-[#23252a] bg-[#0f1011] text-[#8a8f98] hover:border-[#323334] hover:text-[#f7f8f8]"
                }`}
                style={{ fontFamily: mono }}
              >
                {stack === "All" ? "All" : stackLabel(stack)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-xs text-[#62666d]" style={{ fontFamily: mono }}>Sort:</span>
            {(["recent", "endpoints", "name"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSort(item)}
                className={`rounded-md border px-3 py-1.5 text-xs capitalize transition-colors ${
                  sort === item ? "border-[#323334] bg-[#161718] text-[#f7f8f8]" : "border-transparent text-[#62666d] hover:text-[#8a8f98]"
                }`}
                style={{ fontFamily: mono }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-[#23252a] bg-[#0f1011] px-6 py-16 text-center text-[#8a8f98]" style={{ fontFamily: mono }}>
            Loading live registry contracts...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[#3a3020] bg-[#16120d] px-6 py-12 text-center">
            <p className="font-medium text-[#f7f8f8]">Public registry is temporarily unavailable.</p>
            <p className="mt-2 text-sm text-[#8a8f98]">{error}. No placeholder contracts are being shown.</p>
            <a href={REGISTRY_ORIGIN} className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#f36127] px-5 py-2.5 text-sm font-medium text-white">
              Open live registry <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-[#62666d]">
            <Search className="mx-auto mb-4 h-10 w-10 opacity-50" />
            <p className="font-medium text-[#8a8f98]">No contracts found</p>
            <p className="mt-1 text-sm">Try a different search or stack filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((contract, index) => (
              <Link
                key={contract.slug}
                href={`/registry/${contract.slug}`}
                className="group block overflow-hidden rounded-xl border border-[#23252a] bg-[#0f1011] p-6 transition-all hover:-translate-y-0.5 hover:border-[#323334] hover:shadow-[0_16px_45px_rgba(0,0,0,0.35)]"
                style={{ animation: `fadeUp 0.4s ${index * 0.04}s ease both`, boxShadow: "inset 0 0 0 1px rgba(35,37,42,0.4)" }}
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[#f7f8f8] transition-colors group-hover:text-[#f36127]" style={{ fontFamily: mono }}>{contract.name}</div>
                    <div className="mt-1 truncate text-xs text-[#62666d]" style={{ fontFamily: mono }}>{contract.slug}</div>
                  </div>
                  <span className="rounded bg-[#f36127]/15 px-2 py-0.5 text-[10px] font-bold text-[#f36127]" style={{ fontFamily: mono }}>LIVE</span>
                </div>
                <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-[#8a8f98]">
                  {contract.description || "Published Contrakt API contract with machine-readable endpoints and registry metadata."}
                </p>
                <div className="mb-6 flex flex-wrap gap-1.5">
                  <span className="rounded border border-[#23252a] bg-[#161718] px-2 py-1 text-[10px] font-bold text-[#8a8f98]" style={{ fontFamily: mono }}>
                    {stackLabel(contract.stack)}
                  </span>
                  <span className="rounded border border-[#3a3020] bg-[#201810] px-2 py-1 text-[10px] font-bold text-[#f36127]" style={{ fontFamily: mono }}>
                    MCP
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#23252a] pt-4">
                  <div className="flex min-w-0 items-center gap-3 text-xs text-[#62666d]" style={{ fontFamily: mono }}>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Live</span>
                    <span>{contract.endpointCount ?? 0} endpoints</span>
                    <span>{formatDate(contract.updatedAt)}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#62666d] transition-all group-hover:translate-x-0.5 group-hover:text-[#f36127]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1200px] px-6 pb-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-xl border border-[#23252a] bg-[#0f1011] p-8 md:flex-row" style={{ boxShadow: "inset 0 0 0 1px rgba(35,37,42,0.4)" }}>
          <div>
            <div className="mb-2 text-xs uppercase tracking-widest text-[#62666d]" style={{ fontFamily: mono }}>Publish your API</div>
            <h3 className="mb-1 text-3xl font-light text-[#f7f8f8]">Add your contract to the registry.</h3>
            <p className="text-sm text-[#8a8f98]">
              Sign in with GitHub, then run <code className="font-mono text-[#d0d6e0]">contrakt publish</code> from your project root.
            </p>
          </div>
          <a href={githubLoginHref} className="flex shrink-0 items-center gap-2 rounded-md bg-[#f36127] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90">
            Continue with GitHub <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </main>
  );
}
