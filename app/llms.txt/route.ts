import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const appUrl = "https://registry.contrakt.dev";

  const rows = await db
    .select({
      slug: contracts.slug,
      endpointCount: contracts.endpointCount,
      stack: contracts.stack,
      updatedAt: contracts.updatedAt,
    })
    .from(contracts)
    .orderBy(sql`${contracts.updatedAt} DESC`)
    .limit(500);

  const contractList = rows
    .map(
      (c) =>
        `- [${c.slug}](${appUrl}/u/${c.slug}) — ${c.endpointCount} endpoint(s)${c.stack ? `, ${c.stack}` : ""}, updated ${new Date(c.updatedAt).toISOString().split("T")[0]}`
    )
    .join("\n");

  const body = `# Contrakt Registry

> Public registry of API contracts inferred from real Next.js applications. Each contract describes the exact endpoints, request schemas, and response shapes of a published app — no hand-written specs.

## How AI agents can use this registry

Search for contracts:
  GET ${appUrl}/api/registry/search?q=<query>
  GET ${appUrl}/api/registry/search?stack=nextjs-app-router

Fetch a full contract (endpoints + schemas):
  GET ${appUrl}/api/registry/contracts/<username>/<app>

Get an MCP server config to call an app directly:
  GET ${appUrl}/api/registry/contracts/<username>/<app>/mcp?base_url=<running-app-url>

## Meta-MCP server

Install once in Claude Desktop to search this registry from any conversation:

\`\`\`json
{
  "mcpServers": {
    "contrakt-registry": {
      "command": "contrakt",
      "args": ["registry-mcp"]
    }
  }
}
\`\`\`

Tools available: search_registry, get_contract, get_mcp_config

## Published Contracts (${rows.length} total)

${contractList || "No contracts published yet."}
`;

  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
