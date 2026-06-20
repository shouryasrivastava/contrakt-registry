import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, monetizationConfigs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getX402Network } from "@/lib/x402";
import { normalizeDeploymentUrl } from "@/lib/deployment-url";
import { apiError } from "@/lib/api-response";
import { enforceRateLimit, requestIdentifier } from "@/lib/rate-limit";

type Endpoint = { method: string; path: string };
type ContractData = { endpoints?: Endpoint[] };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; app: string }> }
) {
  const limited = await enforceRateLimit({
    namespace: "contract-mcp",
    identifier: requestIdentifier(req),
    limit: 120,
    windowSeconds: 60,
  });
  if (limited) return limited;
  const { username, app } = await params;
  const slug = `${username}/${app}`;
  const requestedBaseUrl = new URL(req.url).searchParams.get("base_url");

  const row = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });

  if (!row) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
  let baseUrl = row.baseUrl ?? null;
  if (requestedBaseUrl) {
    const normalized = normalizeDeploymentUrl(requestedBaseUrl);
    if (!normalized.ok) return apiError(400, "BAD_REQUEST", normalized.error);
    baseUrl = normalized.url;
  }
  if (!baseUrl) {
    return apiError(
      409,
      "CONFLICT",
      "This contract needs a production deployment URL before MCP configuration can be generated.",
    );
  }

  const contractData = row.contract as ContractData;
  const endpoints = contractData?.endpoints ?? [];
  const appUrl = "https://registry.contrakt.dev";

  // Include monetization config if enabled
  const monetization = await db.query.monetizationConfigs.findFirst({
    where: eq(monetizationConfigs.contractId, row.id),
  });

  const net = getX402Network();
  const monetizationField =
    monetization && monetization.enabled
      ? {
          enabled: true,
          receiverAddress: monetization.receiverAddress,
          priceUsd: monetization.priceUsd,
          freeTierCalls: monetization.freeTierCalls,
          network: net.name,
          token: "USDC",
          tokenAddress: net.usdcAddress,
          verifyUrl: `${appUrl}/api/registry/contracts/${slug}/payments`,
          freeTierUrl: `${appUrl}/api/registry/contracts/${slug}/free-tier`,
        }
      : null;

  const config = {
    mcpServers: {
      [app]: {
        command: "contrakt",
        args: ["run-mcp", "--slug", slug, "--base-url", baseUrl],
      },
    },
    monetization: monetizationField,
    _meta: {
      slug,
      registryUrl: `${appUrl}/u/${slug}`,
      contractUrl: `${appUrl}/api/registry/contracts/${slug}`,
      endpointCount: endpoints.length,
      endpoints: endpoints.map((ep) => `${ep.method} ${ep.path}`),
      instructions: [
        `This config wires Claude Desktop to call ${slug} directly as MCP tools.`,
        `Replace the base_url with where the app is actually running.`,
        `To regenerate with a different base URL: GET ${appUrl}/api/registry/contracts/${slug}/mcp?base_url=https://yourapp.com`,
        ...(monetizationField
          ? [
              `This API requires payment after ${monetizationField.freeTierCalls} free calls.`,
              `Pay ${monetizationField.priceUsd} USDC on ${monetizationField.network} to ${monetizationField.receiverAddress}, then POST txHash to ${monetizationField.verifyUrl}.`,
            ]
          : []),
      ],
    },
  };

  return NextResponse.json(config);
}
