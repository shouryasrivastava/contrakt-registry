import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getOwnedContract } from "@/lib/owner-contract-data";
import { webhooks } from "@/lib/schema";
import OwnerConsoleShell from "@/app/components/OwnerConsoleShell";
import IntegrationSettings from "@/app/components/IntegrationSettings";

interface PageProps {
  params: Promise<{ user: string; app: string }>;
}

export default async function IntegrationsPage({ params }: PageProps) {
  const { user, app } = await params;
  const { session, contract, slug } = await getOwnedContract(user, app);
  const rows = await db
    .select({
      id: webhooks.id,
      url: webhooks.url,
      enabled: webhooks.enabled,
      createdAt: webhooks.createdAt,
    })
    .from(webhooks)
    .where(eq(webhooks.contractId, contract.id));
  const registryOrigin = "https://registry.contrakt.dev";
  const publicUrl = `${registryOrigin}/u/${slug}`;
  const mcpUrl = `${registryOrigin}/api/registry/contracts/${slug}/mcp`;
  const rawUrl = `${registryOrigin}/api/registry/contracts/${slug}`;
  const badgeMarkdown = `![Contrakt API](${registryOrigin}/badge/${slug})`;
  const watchCommand = `contrakt watch ${publicUrl}`;

  return (
    <OwnerConsoleShell
      active="integrations"
      session={session}
      slug={slug}
      appName={contract.name}
      endpointCount={contract.endpointCount}
    >
      <div className="p-5 sm:p-7">
        <div className="border-b border-border pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Distribution</p>
          <h1 className="mt-2 text-[34px] leading-none text-ink">Integrations</h1>
          <p className="mt-2 text-[13px] text-muted">Choose where agents call your API and how consumers track changes.</p>
        </div>
        <div className="mt-6">
          <IntegrationSettings
            slug={slug}
            initialBaseUrl={contract.baseUrl ?? ""}
            initialWebhooks={rows}
            publicUrl={publicUrl}
            mcpUrl={mcpUrl}
            rawUrl={rawUrl}
            badgeMarkdown={badgeMarkdown}
            watchCommand={watchCommand}
          />
        </div>
      </div>
    </OwnerConsoleShell>
  );
}
