import { desc, eq } from "drizzle-orm";
import { Code2, KeyRound, WalletCards } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/access";
import { db } from "@/lib/db";
import { apiTokens } from "@/lib/schema";
import OwnerConsoleShell from "@/app/components/OwnerConsoleShell";
import TokenManager from "@/app/components/TokenManager";
import ConnectWalletButton from "@/app/components/ConnectWalletButton";
import DisconnectGitHubButton from "@/app/components/DisconnectGitHubButton";

export default async function SettingsPage() {
  const session = await auth();
  requireSession(session, "/dashboard/settings");

  const tokens = await db
    .select({
      id: apiTokens.id,
      tokenPrefix: apiTokens.tokenPrefix,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, session.user.id))
    .orderBy(desc(apiTokens.createdAt));

  return (
    <OwnerConsoleShell active="settings" session={session}>
      <div className="p-5 sm:p-7">
        <div className="border-b border-border pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Account</p>
          <h1 className="mt-2 text-[34px] leading-none text-ink">Settings</h1>
          <p className="mt-2 text-[13px] text-muted">Manage publishing credentials, your wallet, and GitHub identity.</p>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <section className="rounded-[12px] border border-border bg-white p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-[9px] bg-[#f2f2f2]">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-[19px] text-ink">Publish tokens</h2>
                <p className="mt-1 text-[12px] text-muted">Used by the CLI to publish contracts. Tokens are stored as hashes.</p>
              </div>
            </div>
            <TokenManager initialTokens={tokens} />
          </section>

          <div className="space-y-5">
            <section className="rounded-[12px] border border-border bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-[9px] bg-[#f2f2f2]">
                  <Code2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[19px] text-ink">GitHub account</h2>
                  <p className="mt-1 truncate text-[12px] text-muted">
                    Signed in as {session.user.username ?? session.user.name ?? session.user.email}
                  </p>
                </div>
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <DisconnectGitHubButton />
              </div>
            </section>

            <section className="rounded-[12px] border border-border bg-white p-5">
              <div className="mb-5 flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-[9px] bg-[#f2f2f2]">
                  <WalletCards className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[19px] text-ink">Settlement wallet</h2>
                  <p className="mt-1 text-[12px] text-muted">
                    Connect a wallet to receive x402 USDC payments and inspect its Base balance.
                  </p>
                </div>
              </div>
              <ConnectWalletButton />
            </section>
          </div>
        </div>
      </div>
    </OwnerConsoleShell>
  );
}
