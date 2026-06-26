"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Copy, ExternalLink, GitBranch, Star } from "lucide-react";

const githubUrl = "https://github.com/shouryasrivastava/contrakt";
const REGISTRY_ORIGIN = process.env.NEXT_PUBLIC_REGISTRY_URL || "https://registry.contrakt.dev";
const githubLoginHref = `${REGISTRY_ORIGIN}/sign-in?next=${encodeURIComponent("/dashboard")}`;
const mono = "'JetBrains Mono', 'DM Mono', monospace";

type LiveEndpoint = {
  method?: string;
  path?: string;
  description?: string;
  requestSchema?: unknown;
  responseSchema?: unknown;
  input?: Record<string, { type: string; required?: boolean; description?: string }>;
  output?: Record<string, { type: string; description?: string }>;
};

type LiveContract = {
  slug?: string;
  name?: string;
  description?: string | null;
  stack?: string | null;
  endpointCount?: number | null;
  updatedAt?: string | null;
  registryUrl?: string;
  mcpConfigUrl?: string;
  endpoints?: LiveEndpoint[];
  contract?: {
    slug?: string;
    name?: string;
    description?: string | null;
    stack?: string | null;
    endpointCount?: number | null;
    updatedAt?: string | null;
    endpoints?: LiveEndpoint[];
  };
};

type TabId = "endpoints" | "contract" | "mcp" | "openapi";

const methodColors: Record<string, string> = {
  GET: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  POST: "border-green-500/30 bg-green-500/10 text-green-300",
  PUT: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  PATCH: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  DELETE: "border-red-500/30 bg-red-500/10 text-red-300",
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
        <a href={githubLoginHref} className="flex items-center gap-1.5 rounded-md bg-[#f36127] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
          <GitBranch className="h-3.5 w-3.5" /> Login
        </a>
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button type="button" onClick={copy} className="rounded p-1 text-[#62666d] transition-colors hover:text-[#f7f8f8]" aria-label="Copy">
      {copied ? <Check className="h-3.5 w-3.5 text-[#27a644]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function SchemaBlock({ title, schema }: { title: string; schema: unknown }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#62666d]" style={{ fontFamily: mono }}>{title}</p>
      <pre className="scrollbar-hide max-h-72 overflow-auto rounded-md border border-[#23252a] bg-[#161718] px-3 py-2.5 text-xs leading-5 text-[#8a8f98]" style={{ fontFamily: mono }}>
        {JSON.stringify(schema || {}, null, 2)}
      </pre>
    </div>
  );
}

function EndpointRow({ endpoint }: { endpoint: LiveEndpoint }) {
  const [open, setOpen] = useState(false);
  const method = (endpoint.method || "GET").toUpperCase();
  const path = endpoint.path || "/api/unknown";

  return (
    <div className="overflow-hidden rounded-xl border border-[#23252a] bg-[#0f1011]" style={{ boxShadow: "inset 0 0 0 1px rgba(35,37,42,0.4)" }}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#161718]">
        <span className={`shrink-0 rounded border px-2 py-1 text-[11px] font-bold ${methodColors[method] ?? "border-gray-500/30 bg-gray-500/10 text-gray-300"}`} style={{ fontFamily: mono }}>
          {method}
        </span>
        <span className="flex-1 text-sm text-[#f7f8f8]" style={{ fontFamily: mono }}>{path}</span>
        <span className="hidden flex-1 truncate pr-4 text-sm text-[#8a8f98] md:block">{endpoint.description || "No description provided"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#62666d] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="border-t border-[#23252a] bg-[#0b0c0e] px-5 py-5">
          <p className="mb-5 text-sm text-[#8a8f98] md:hidden">{endpoint.description || "No description provided"}</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SchemaBlock title="Request" schema={endpoint.input ?? endpoint.requestSchema ?? {}} />
            <SchemaBlock title="Response" schema={endpoint.output ?? endpoint.responseSchema ?? {}} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ApiDetailPage() {
  const params = useParams<{ slug?: string[] }>();
  const slug = (params.slug ?? []).join("/");
  const [payload, setPayload] = useState<LiveContract | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("endpoints");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/registry/contracts/${slug}`, {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Live contract data unavailable");
        setPayload(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setPayload(null);
          setError(err instanceof Error ? err.message : "Live contract data unavailable");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (slug) void load();
    return () => controller.abort();
  }, [slug]);

  const contract = useMemo(() => payload?.contract ?? payload ?? {}, [payload]);
  const endpoints = useMemo(() => (contract.endpoints ?? payload?.endpoints ?? []) as LiveEndpoint[], [contract, payload]);
  const name = contract.name || slug.split("/").at(-1) || "Contract";
  const fullSlug = contract.slug || slug;

  const samples = useMemo(() => {
    const contractJson = JSON.stringify({ ...contract, endpoints }, null, 2);
    const mcpJson = JSON.stringify(
      {
        schema_version: "1.0",
        name,
        description: contract.description,
        tools: endpoints.map((endpoint) => ({
          name: (endpoint.path || "tool").replace(/\//g, "_").replace(/[\[\]]/g, "").replace(/^_/, "").replace(/_$/, ""),
          description: endpoint.description,
          inputSchema: endpoint.input ?? endpoint.requestSchema ?? {},
        })),
      },
      null,
      2,
    );
    const openapi = `openapi: "3.1.0"
info:
  title: ${name}
  version: "latest"
paths:
${endpoints
  .slice(0, 8)
  .map((endpoint) => `  ${endpoint.path || "/api/unknown"}:
    ${(endpoint.method || "get").toLowerCase()}:
      summary: ${endpoint.description || "No description provided"}
      responses:
        "200":
          description: Success`)
  .join("\n")}`;

    return { contract: contractJson, mcp: mcpJson, openapi };
  }, [contract, endpoints, name]);

  const tabContent: Record<Exclude<TabId, "endpoints">, string> = {
    contract: samples.contract,
    mcp: samples.mcp,
    openapi: samples.openapi,
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090a] font-sans">
        <DarkRegistryNav />
        <div className="mt-20 text-center text-[#8a8f98]" style={{ fontFamily: mono }}>Loading live contract...</div>
      </main>
    );
  }

  if (error || !payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090a] font-sans">
        <DarkRegistryNav />
        <div className="mx-auto mt-20 max-w-md rounded-xl border border-[#3a3020] bg-[#16120d] p-8 text-center">
          <p className="font-medium text-[#f7f8f8]">Live contract unavailable</p>
          <p className="mt-2 text-sm text-[#8a8f98]">{error || "Contrakt could not load this contract."}</p>
          <Link href="/registry" className="mt-5 inline-flex text-sm font-semibold text-[#f36127] hover:underline">
            Back to registry
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090a] font-sans text-[#f7f8f8] antialiased">
      <DarkRegistryNav />
      <div className="pt-[60px]">
        <div className="border-b border-[#23252a]">
          <div className="mx-auto flex max-w-[1200px] items-center gap-2 px-6 py-3 text-sm text-[#62666d]" style={{ fontFamily: mono }}>
            <Link href="/registry" className="flex items-center gap-1 transition-colors hover:text-[#f7f8f8]">
              <ArrowLeft className="h-3.5 w-3.5" /> Registry
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-[#f7f8f8]">{fullSlug}</span>
          </div>
        </div>

        <section className="border-b border-[#23252a] px-6">
          <div className="mx-auto max-w-[1200px] py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[clamp(32px,5vw,52px)] font-light leading-none tracking-[-0.8px] text-[#f7f8f8]">{name}</h1>
                  <span className="rounded bg-[#161718] px-2 py-1 text-xs text-[#8a8f98]" style={{ fontFamily: mono }}>{stackLabel(contract.stack)}</span>
                  <span className="rounded bg-[#f36127]/15 px-2 py-1 text-xs font-bold text-[#f36127]" style={{ fontFamily: mono }}>MCP</span>
                </div>
                <p className="mb-5 max-w-2xl text-[16px] leading-[1.65] text-[#8a8f98]">
                  {contract.description || "Published Contrakt API contract with machine-readable endpoint metadata."}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#62666d]" style={{ fontFamily: mono }}>
                  <span>{fullSlug}</span>
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Live</span>
                  <span>Updated: {formatDate(contract.updatedAt)}</span>
                </div>
              </div>
              <a href={payload.registryUrl || `${REGISTRY_ORIGIN}/u/${fullSlug}`} className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#f36127] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
                <ExternalLink className="h-3.5 w-3.5" /> Open live
              </a>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <div className="sticky top-[76px] flex flex-col gap-4">
                <div className="overflow-hidden rounded-xl border border-[#23252a] bg-[#0f1011]" style={{ boxShadow: "inset 0 0 0 1px rgba(35,37,42,0.4)" }}>
                  <div className="border-b border-[#23252a] px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#62666d]" style={{ fontFamily: mono }}>Metadata</p>
                  </div>
                  <div className="flex flex-col gap-3.5 px-5 py-4">
                    {[
                      { label: "Slug", value: fullSlug },
                      { label: "Stack", value: stackLabel(contract.stack) },
                      { label: "Endpoints", value: `${contract.endpointCount ?? endpoints.length} total` },
                      { label: "Updated", value: formatDate(contract.updatedAt) },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="mb-0.5 text-xs text-[#62666d]">{row.label}</div>
                        <div className="break-words text-sm font-medium text-[#f7f8f8]">{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-4 text-xs" style={{ fontFamily: mono, boxShadow: "inset 0 0 0 1px rgba(35,37,42,0.4)" }}>
                  <p className="mb-2 text-[#62666d]">Add to project</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-[#8a8f98]"><span className="text-[#f36127]">$ </span>contrakt add {fullSlug}</span>
                    <CopyButton text={`contrakt add ${fullSlug}`} />
                  </div>
                </div>
              </div>
            </aside>

            <section className="lg:col-span-9">
              <div className="mb-6 flex w-fit flex-wrap gap-1 rounded-xl border border-[#23252a] bg-[#0f1011] p-1">
                {(["endpoints", "contract", "mcp", "openapi"] as TabId[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                      activeTab === tab ? "bg-[#f36127] text-white" : "text-[#62666d] hover:text-[#f7f8f8]"
                    }`}
                    style={{ fontFamily: mono }}
                  >
                    {tab === "endpoints" ? "Endpoints" : tab === "contract" ? "contract.json" : tab === "mcp" ? "mcp-manifest.json" : "openapi.yaml"}
                  </button>
                ))}
              </div>

              {activeTab === "endpoints" ? (
                endpoints.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {endpoints.map((endpoint, index) => (
                      <EndpointRow key={`${endpoint.path}-${index}`} endpoint={endpoint} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-8 text-center text-sm text-[#8a8f98]">No endpoint details are available for this contract.</div>
                )
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#23252a] bg-[#0f1011]" style={{ boxShadow: "inset 0 0 0 1px rgba(35,37,42,0.4)" }}>
                  <div className="flex items-center justify-between border-b border-[#23252a] px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-[#3a2020]" />
                      <span className="h-3 w-3 rounded-full bg-[#3a3020]" />
                      <span className="h-3 w-3 rounded-full bg-[#1a3020]" />
                      <span className="ml-3 text-xs text-[#62666d]" style={{ fontFamily: mono }}>{activeTab === "contract" ? "contract.json" : activeTab === "mcp" ? "mcp-manifest.json" : "openapi.yaml"}</span>
                    </div>
                    <CopyButton text={tabContent[activeTab]} />
                  </div>
                  <pre className="scrollbar-hide max-h-[600px] overflow-x-auto overflow-y-auto p-6 text-sm leading-relaxed text-[#8a8f98]" style={{ fontFamily: mono }}>
                    <code>{tabContent[activeTab]}</code>
                  </pre>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
