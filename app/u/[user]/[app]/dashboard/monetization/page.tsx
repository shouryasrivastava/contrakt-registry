import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { getOwnedContract } from "@/lib/owner-contract-data";
import { monetizationConfigs, paymentReceipts, userWallets } from "@/lib/schema";
import OwnerConsoleShell from "@/app/components/OwnerConsoleShell";
import MonetizationForm from "@/app/components/MonetizationForm";

interface PageProps {
  params: Promise<{ user: string; app: string }>;
}

export default async function MonetizationPage({ params }: PageProps) {
  const { user, app } = await params;
  const { session, contract, slug } = await getOwnedContract(user, app, `/u/${user}/${app}/dashboard/monetization`);
  const [monetization, connectedWallet] = await Promise.all([
    db.query.monetizationConfigs.findFirst({
      where: eq(monetizationConfigs.contractId, contract.id),
    }),
    db.query.userWallets.findFirst({
      where: eq(userWallets.userId, session.user.id),
      orderBy: [desc(userWallets.updatedAt)],
    }),
  ]);
  const receipts = monetization
    ? await db
        .select()
        .from(paymentReceipts)
        .where(eq(paymentReceipts.monetizationConfigId, monetization.id))
        .orderBy(desc(paymentReceipts.verifiedAt))
        .limit(50)
    : [];
  const totals = monetization
    ? await db
        .select({
          calls: sql<number>`count(*)::int`,
          rawUsdc: sql<string>`coalesce(sum(${paymentReceipts.amountUsdc}::numeric), 0)::text`,
        })
        .from(paymentReceipts)
        .where(eq(paymentReceipts.monetizationConfigId, monetization.id))
    : [{ calls: 0, rawUsdc: "0" }];
  const total = totals[0] ?? { calls: 0, rawUsdc: "0" };

  return (
    <OwnerConsoleShell
      active="monetization"
      session={session}
      slug={slug}
      appName={contract.name}
      endpointCount={contract.endpointCount}
    >
      <div className="p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">x402 monetization</p>
              <span className="rounded-full bg-[#fff0e9] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-accent">Beta</span>
            </div>
            <h1 className="mt-2 text-[34px] leading-none text-ink">Monetization</h1>
            <p className="mt-2 text-[13px] text-muted">Set a USDC price and inspect receipts Contrakt verified on Base.</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Verified received</p>
            <p className="mt-1 text-[22px] text-ink">
              {(Number(total.rawUsdc) / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 6 })} USDC
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
          <section className="rounded-[12px] border border-border bg-white p-5">
            <h2 className="text-[20px] text-ink">Pricing configuration</h2>
            <p className="mb-5 mt-1 text-[11px] text-muted">Applied to MCP calls for this published contract.</p>
            <MonetizationForm
              slug={slug}
              initial={monetization ?? null}
              connectedWalletAddress={connectedWallet?.address ?? null}
            />
          </section>

          <section className="overflow-hidden rounded-[12px] border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-[20px] text-ink">Verified receipts</h2>
                <p className="mt-1 text-[11px] text-muted">{total.calls} paid calls recorded on-chain.</p>
              </div>
            </div>
            {receipts.length ? (
              <div className="divide-y divide-border">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_0.6fr_0.7fr_auto] md:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] text-ink">{receipt.agentId}</p>
                      <p className="mt-1 text-[10px] text-faint">{receipt.verifiedAt.toLocaleString()}</p>
                    </div>
                    <p className="text-[12px] font-semibold text-ink">
                      {(Number(receipt.amountUsdc) / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 6 })} USDC
                    </p>
                    <p className="truncate font-mono text-[10px] text-faint">{receipt.txHash}</p>
                    <Link
                      href={`https://basescan.org/tx/${receipt.txHash}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-ink"
                    >
                      Basescan <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-[310px] place-items-center px-5 text-center">
                <div className="max-w-[360px]">
                  <h3 className="text-[20px] text-ink">No paid calls yet</h3>
                  <p className="mt-2 text-[12px] leading-5 text-muted">
                    Receipts appear here only after a valid Base USDC transfer is verified. Contrakt does not estimate revenue.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </OwnerConsoleShell>
  );
}
