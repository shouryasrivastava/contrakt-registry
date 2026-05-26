import { auth, signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { sql, desc } from "drizzle-orm";
import Link from "next/link";
import ContractSearch from "./components/ContractSearch";

async function getContracts(q?: string, stack?: string) {
  const { ilike, and, or } = await import("drizzle-orm");
  const conditions = [];

  if (q) {
    conditions.push(
      or(ilike(contracts.slug, `%${q}%`), ilike(contracts.name, `%${q}%`))
    );
  }
  if (stack) {
    conditions.push(ilike(contracts.stack, `%${stack}%`));
  }

  const query = db
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
    .orderBy(desc(contracts.updatedAt))
    .limit(50);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stack?: string }>;
}) {
  const session = await auth();
  const resolvedParams = await searchParams;
  const { q, stack } = resolvedParams;

  let contractList: Awaited<ReturnType<typeof getContracts>> = [];
  try {
    contractList = await getContracts(q, stack);
  } catch {
    // DB not configured yet, show empty state
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-white font-semibold text-sm tracking-tight">
              contrakt
            </span>
            <span className="text-[#6b7280] text-sm font-light">registry</span>
          </Link>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Sign out
                  </button>
                </form>
                {session.user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "Avatar"}
                    className="w-7 h-7 rounded-full border border-[#1f1f1f]"
                  />
                )}
              </>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-black text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Sign in with GitHub
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
          Contrakt Registry
        </h1>
        <p className="text-[#6b7280] text-lg max-w-xl mx-auto mb-10">
          Discover API contracts published by the community. Publish yours with{" "}
          <code className="text-gray-300 bg-[#111111] px-1.5 py-0.5 rounded text-sm font-mono border border-[#1f1f1f]">
            contrakt publish
          </code>
          .
        </p>

        <ContractSearch initialQ={q} initialStack={stack} />
      </div>

      {/* Contract Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {contractList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#6b7280] text-sm">
              {q || stack
                ? "No contracts found matching your search."
                : "No contracts published yet. Be the first!"}
            </p>
            <p className="text-[#444] text-xs mt-2 font-mono">
              contrakt publish
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractList.map((contract) => {
              const [username, name] = contract.slug.split("/");
              return (
                <Link
                  key={contract.id}
                  href={`/c/${username}/${name}`}
                  className="group block p-5 bg-[#111111] border border-[#1f1f1f] rounded-xl hover:border-[#2d2d2d] hover:bg-[#141414] transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-xs text-[#6b7280] mb-0.5">
                        {username}
                      </p>
                      <p className="text-white font-medium text-sm truncate group-hover:text-blue-400 transition-colors">
                        {name}
                      </p>
                    </div>
                    <StackBadge stack={contract.stack} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#6b7280]">
                    <span>
                      {contract.endpointCount} endpoint
                      {contract.endpointCount !== 1 ? "s" : ""}
                    </span>
                    <span>{timeAgo(contract.updatedAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
