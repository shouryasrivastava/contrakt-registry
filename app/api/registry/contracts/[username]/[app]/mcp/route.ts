import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { eq } from "drizzle-orm";

type Endpoint = { method: string; path: string };
type ContractData = { endpoints?: Endpoint[] };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; app: string }> }
) {
  const { username, app } = await params;
  const slug = `${username}/${app}`;
  const baseUrl =
    new URL(req.url).searchParams.get("base_url") ?? "http://localhost:3000";

  const row = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });

  if (!row) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const contractData = row.contract as ContractData;
  const endpoints = contractData?.endpoints ?? [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://contrakt-registry.vercel.app";

  const config = {
    mcpServers: {
      [app]: {
        command: "contrakt",
        args: ["run-mcp", "--slug", slug, "--base-url", baseUrl],
      },
    },
    _meta: {
      slug,
      registryUrl: `${appUrl}/c/${slug}`,
      contractUrl: `${appUrl}/api/registry/contracts/${slug}`,
      endpointCount: endpoints.length,
      endpoints: endpoints.map((ep) => `${ep.method} ${ep.path}`),
      instructions: [
        `This config wires Claude Desktop to call ${slug} directly as MCP tools.`,
        `Replace the base_url with where the app is actually running.`,
        `To regenerate with a different base URL: GET ${appUrl}/api/registry/contracts/${slug}/mcp?base_url=https://yourapp.com`,
      ],
    },
  };

  return NextResponse.json(config);
}
