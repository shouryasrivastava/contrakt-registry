import { db } from "@/lib/db";
import { contracts, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ username: string; name: string }>;
}

interface Endpoint {
  method?: string;
  path?: string;
  description?: string;
  requestBody?: unknown;
  responses?: Record<string, unknown>;
}

interface ContractData {
  stack?: string;
  version?: string;
  endpoints?: Endpoint[];
  [key: string]: unknown;
}

async function getContract(username: string, name: string) {
  const slug = `${username}/${name}`;
  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });
  return contract;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, name } = await params;
  return {
    title: `${username}/${name} — Contrakt Registry`,
    description: `API contract for ${username}/${name}`,
  };
}

function methodColor(method: string): string {
  const m = method.toUpperCase();
  if (m === "GET") return "text-green-400 bg-green-400/10 border-green-400/20";
  if (m === "POST") return "text-blue-400 bg-blue-400/10 border-blue-400/20";
  if (m === "PUT") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  if (m === "PATCH") return "text-orange-400 bg-orange-400/10 border-orange-400/20";
  if (m === "DELETE") return "text-red-400 bg-red-400/10 border-red-400/20";
  return "text-gray-400 bg-gray-400/10 border-gray-400/20";
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} days ago`;
  if (hours > 0) return `${hours} hours ago`;
  if (minutes > 0) return `${minutes} minutes ago`;
  return "just now";
}

export default async function ContractDetailPage({ params }: PageProps) {
  const { username, name } = await params;
  const contract = await getContract(username, name);

  if (!contract) {
    notFound();
  }

  const contractData = contract.contract as ContractData;
  const endpoints: Endpoint[] = contractData.endpoints ?? [];
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://registry.contrakt.dev";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 group"
          >
            <span className="text-white font-semibold text-sm tracking-tight">
              contrakt
            </span>
            <span className="text-[#6b7280] text-sm font-light">registry</span>
          </Link>
          <span className="text-[#1f1f1f]">/</span>
          <span className="text-[#6b7280] text-sm">
            <Link href="/" className="hover:text-white transition-colors">
              Browse
            </Link>
          </span>
          <span className="text-[#1f1f1f]">/</span>
          <span className="text-white text-sm font-mono">
            {username}/{name}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Contract header */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[#6b7280] text-sm mb-1">
                <Link
                  href={`https://github.com/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  @{username}
                </Link>
              </p>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {name}
              </h1>
            </div>
            {contractData.stack && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {contractData.stack}
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 mt-6 text-sm text-[#6b7280]">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>{contract.endpointCount} endpoints</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Updated {timeAgo(contract.updatedAt)}</span>
            </div>
            {contractData.version && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 10V5a2 2 0 012-2z" />
                </svg>
                <span>v{contractData.version}</span>
              </div>
            )}
          </div>
        </div>

        {/* Install section */}
        <div className="mb-10 p-5 bg-[#111111] border border-[#1f1f1f] rounded-xl">
          <h2 className="text-sm font-medium text-[#6b7280] uppercase tracking-wider mb-3">
            Use this contract
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <code className="flex-1 text-sm font-mono text-gray-300 bg-[#0a0a0a] px-4 py-2.5 rounded-lg border border-[#1f1f1f]">
              contrakt check --registry {appUrl}/c/{contract.slug}
            </code>
          </div>
          <p className="text-xs text-[#6b7280]">
            Run this command in your project directory to validate your API against this published contract.
          </p>
        </div>

        {/* Endpoints */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Endpoints
          </h2>

          {endpoints.length === 0 ? (
            <div className="text-center py-12 bg-[#111111] border border-[#1f1f1f] rounded-xl">
              <p className="text-[#6b7280] text-sm">
                No endpoints defined in this contract.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {endpoints.map((endpoint, i) => {
                const method = endpoint.method ?? "GET";
                const path = endpoint.path ?? "/";
                const responses = endpoint.responses as Record<string, { description?: string; schema?: unknown }> | undefined;
                const responseCodes = responses ? Object.keys(responses) : [];

                return (
                  <div
                    key={i}
                    className="p-4 bg-[#111111] border border-[#1f1f1f] rounded-xl hover:border-[#2d2d2d] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border ${methodColor(method)}`}
                      >
                        {method.toUpperCase()}
                      </span>
                      <code className="text-sm text-white font-mono">{path}</code>
                    </div>
                    {endpoint.description && (
                      <p className="text-sm text-[#6b7280] mb-2">
                        {endpoint.description}
                      </p>
                    )}
                    {responseCodes.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <span className="text-xs text-[#444]">Responses:</span>
                        {responseCodes.map((code) => {
                          const responseData = responses?.[code];
                          const description = responseData?.description;
                          return (
                            <span
                              key={code}
                              title={description}
                              className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                                code.startsWith("2")
                                  ? "bg-green-400/10 text-green-400"
                                  : code.startsWith("4")
                                  ? "bg-yellow-400/10 text-yellow-400"
                                  : code.startsWith("5")
                                  ? "bg-red-400/10 text-red-400"
                                  : "bg-gray-400/10 text-gray-400"
                              }`}
                            >
                              {code}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Raw JSON */}
        <details className="mt-10">
          <summary className="cursor-pointer text-sm text-[#6b7280] hover:text-white transition-colors mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            View raw contract JSON
          </summary>
          <pre className="text-xs text-gray-400 bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 overflow-x-auto font-mono leading-relaxed">
            {JSON.stringify(contractData, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
