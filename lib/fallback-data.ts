import type { Contract, MonetizationConfig } from "./schema";

const now = new Date("2026-06-17T00:00:00.000Z");

export const fallbackContract: Contract = {
  id: "fallback-contrakt-registry",
  userId: "fallback-shouryasrivastava",
  name: "contrakt-registry",
  slug: "shouryasrivastava/contrakt-registry",
  contract: {
    schemaSyncVersion: "0.1.0",
    generatedAt: now.toISOString(),
    projectRoot: "registry",
    stack: "nextjs-app-router",
    endpoints: [
      { method: "GET", path: "/api/contracts", statusCodes: [200], description: "Search published contracts." },
      { method: "POST", path: "/api/contracts", statusCodes: [201], description: "Publish a contract with an API token." },
      { method: "GET", path: "/api/contracts/[id]", statusCodes: [200, 404], description: "Fetch a published contract." },
      { method: "GET", path: "/api/tokens", statusCodes: [200], description: "List publisher API tokens." },
      { method: "POST", path: "/api/tokens", statusCodes: [201], description: "Create a publisher API token." },
      { method: "DELETE", path: "/api/tokens/[id]", statusCodes: [204], description: "Revoke a publisher API token." },
      { method: "GET", path: "/api/auth/[...nextauth]", statusCodes: [200], description: "GitHub OAuth endpoint." },
      { method: "POST", path: "/api/auth/[...nextauth]", statusCodes: [200], description: "GitHub OAuth callback endpoint." },
    ],
  },
  endpointCount: 8,
  stack: "nextjs-app-router",
  description: "Public API contract registry for agent-readable MCP tools.",
  baseUrl: null,
  featured: true,
  createdAt: now,
  updatedAt: now,
};

export const fallbackMonetization: MonetizationConfig = {
  id: "fallback-monetization",
  contractId: fallbackContract.id,
  receiverAddress: "0x0000000000000000000000000000000000000000",
  priceUsd: "0.001",
  freeTierCalls: 5,
  enabled: true,
  createdAt: now,
  updatedAt: now,
};

export const fallbackOwner = {
  username: "shouryasrivastava",
  avatarUrl: null,
};
