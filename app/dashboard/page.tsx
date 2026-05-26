import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { contracts, apiTokens } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import TokenManager from "../components/TokenManager";

async function getUserContracts(userId: string) {
  return db
    .select({
      id: contracts.id,
      slug: contracts.slug,
      name: contracts.name,
      endpointCount: contracts.endpointCount,
      stack: contracts.stack,
      createdAt: contracts.createdAt,
      updatedAt: contracts.updatedAt,
    })
    .from(contracts)
    .where(eq(contracts.userId, userId))
    .orderBy(desc(contracts.updatedAt));
}

async function getUserTokens(userId: string) {
  return db
    .select({
      id: apiTokens.id,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, userId))
    .orderBy(desc(apiTokens.createdAt));
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function StackBadge({ stack }: { stack: string | null }) {
  if (!stack) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
      {stack}
    </span>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  let userContracts: Awaited<ReturnType<typeof getUserContracts>> = [];
  let userTokens: Awaited<ReturnType<typeof getUserTokens>> = [];

  try {
    [userContracts, userTokens] = await Promise.all([
      getUserContracts(session.user.id),
      getUserTokens(session.user.id),
    ]);
  } catch {
    // DB not configured yet
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm tracking-tight">
              contrakt
            </span>
            <span className="text-[#6b7280] text-sm font-light">registry</span>
          </Link>
          <div className="flex items-center gap-3">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? "Avatar"}
                className="w-7 h-7 rounded-full border border-[#1f1f1f]"
              />
            )}
            <span className="text-sm text-[#6b7280]">
              {session.user.name}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-white mb-10">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contracts section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Your Contracts
              </h2>
              <span className="text-xs text-[#6b7280] bg-[#111111] border border-[#1f1f1f] px-2 py-1 rounded">
                {userContracts.length} published
              </span>
            </div>

            {userContracts.length === 0 ? (
              <div className="text-center py-16 bg-[#111111] border border-[#1f1f1f] rounded-xl">
                <p className="text-[#6b7280] text-sm mb-4">
                  No contracts published yet.
                </p>
                <div className="inline-block text-left">
                  <p className="text-xs text-[#444] mb-1">Get started:</p>
                  <code className="text-xs font-mono text-gray-400 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-[#1f1f1f] block">
                    contrakt publish
                  </code>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {userContracts.map((contract) => {
                  const [username, name] = contract.slug.split("/");
                  return (
                    <Link
                      key={contract.id}
                      href={`/c/${username}/${name}`}
                      className="group flex items-center justify-between p-4 bg-[#111111] border border-[#1f1f1f] rounded-xl hover:border-[#2d2d2d] hover:bg-[#141414] transition-all duration-150"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white text-sm font-medium font-mono group-hover:text-blue-400 transition-colors">
                            {contract.slug}
                          </p>
                          <StackBadge stack={contract.stack} />
                        </div>
                        <p className="text-xs text-[#6b7280] mt-0.5">
                          {contract.endpointCount} endpoint
                          {contract.endpointCount !== 1 ? "s" : ""} · Updated{" "}
                          {timeAgo(contract.updatedAt)}
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-[#444] group-hover:text-[#6b7280] flex-shrink-0 ml-4 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tokens section */}
          <div>
            <TokenManager initialTokens={userTokens} />
          </div>
        </div>
      </div>
    </div>
  );
}
