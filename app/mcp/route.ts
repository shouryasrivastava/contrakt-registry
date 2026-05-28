import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { ilike, and, or, eq, sql } from "drizzle-orm";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://contrakt-registry.vercel.app";

// MCP tool definitions
const TOOLS = [
  {
    name: "search_registry",
    description:
      "Search the Contrakt public registry for published API contracts. Returns matching apps with endpoint counts, stack info, and URLs.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term — matches app name or owner/app slug" },
        stack: { type: "string", description: "Filter by framework (e.g. nextjs-app-router)" },
        limit: { type: "number", description: "Max results (default 10, max 50)" },
      },
    },
  },
  {
    name: "get_contract",
    description:
      "Fetch the full API contract for a specific app. Returns all endpoints with request/response schemas, path params, query params, and status codes.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "GitHub username of the publisher" },
        app: { type: "string", description: "App name as shown in the registry" },
      },
      required: ["username", "app"],
    },
  },
  {
    name: "get_mcp_config",
    description:
      "Get a Claude Desktop MCP config snippet for a registered app so you can call its endpoints directly as tools.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "GitHub username of the publisher" },
        app: { type: "string", description: "App name as shown in the registry" },
        base_url: {
          type: "string",
          description: "URL where the app is running (e.g. https://myapp.com)",
        },
      },
      required: ["username", "app"],
    },
  },
];

type Args = Record<string, unknown>;

async function callTool(name: string, args: Args): Promise<string> {
  if (name === "search_registry") {
    const conditions = [];
    if (args.query) {
      conditions.push(
        or(ilike(contracts.slug, `%${args.query}%`), ilike(contracts.name, `%${args.query}%`))
      );
    }
    if (args.stack) {
      conditions.push(ilike(contracts.stack, `%${args.stack}%`));
    }
    const q = db
      .select({
        slug: contracts.slug,
        name: contracts.name,
        endpointCount: contracts.endpointCount,
        stack: contracts.stack,
        updatedAt: contracts.updatedAt,
      })
      .from(contracts)
      .limit(Math.min(Number(args.limit ?? 10), 50))
      .orderBy(sql`${contracts.updatedAt} DESC`);
    const rows = conditions.length > 0 ? await q.where(and(...conditions)) : await q;
    return JSON.stringify(
      {
        contracts: rows.map((r) => ({
          ...r,
          url: `${APP_URL}/c/${r.slug}`,
          contractUrl: `${APP_URL}/api/registry/contracts/${r.slug}`,
        })),
      },
      null,
      2
    );
  }

  if (name === "get_contract") {
    const slug = `${args.username}/${args.app}`;
    const row = await db.query.contracts.findFirst({ where: eq(contracts.slug, slug) });
    if (!row) throw new Error(`Contract not found: ${slug}`);
    return JSON.stringify(
      { slug: row.slug, name: row.name, stack: row.stack, endpointCount: row.endpointCount, contract: row.contract, url: `${APP_URL}/c/${slug}`, updatedAt: row.updatedAt },
      null,
      2
    );
  }

  if (name === "get_mcp_config") {
    const slug = `${args.username}/${args.app}`;
    const baseUrl = String(args.base_url ?? "http://localhost:3000");
    const row = await db.query.contracts.findFirst({ where: eq(contracts.slug, slug) });
    if (!row) throw new Error(`Contract not found: ${slug}`);
    const eps = ((row.contract as { endpoints?: { method: string; path: string }[] })?.endpoints ?? []);
    return JSON.stringify(
      {
        mcpServers: {
          [String(args.app)]: { command: "contrakt", args: ["run-mcp", "--slug", slug, "--base-url", baseUrl] },
        },
        _meta: { slug, endpoints: eps.map((e) => `${e.method} ${e.path}`), registryUrl: `${APP_URL}/c/${slug}` },
      },
      null,
      2
    );
  }

  throw new Error(`Unknown tool: ${name}`);
}

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
};

function ok(id: number | string | null | undefined, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function err(id: number | string | null | undefined, code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

async function handleMessage(msg: JsonRpcRequest) {
  const { id, method, params } = msg;

  // Notifications have no id and need no response
  if (method === "notifications/initialized") return null;

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "contrakt-registry", version: "1.0.0" },
    });
  }

  if (method === "tools/list") {
    return ok(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const name = params?.name as string;
    const args = (params?.arguments ?? {}) as Args;
    try {
      const text = await callTool(name, args);
      return ok(id, { content: [{ type: "text", text }] });
    } catch (e) {
      return ok(id, {
        content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
        isError: true,
      });
    }
  }

  return err(id, -32601, `Method not found: ${method}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Handle batch requests
  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map(handleMessage))).filter(Boolean);
    return NextResponse.json(responses);
  }

  const response = await handleMessage(body as JsonRpcRequest);
  // Notifications return null — no response body needed
  if (response === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(response);
}

// GET returns discovery info
export async function GET() {
  return NextResponse.json({
    name: "contrakt-registry",
    version: "1.0.0",
    description: "Search and discover published API contracts",
    tools: TOOLS.map((t) => t.name),
    addToClaudeCode: `claude mcp add --transport http contrakt-registry ${APP_URL}/mcp`,
  });
}
