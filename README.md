# Contrakt Registry

The public registry for the [`contrakt`](https://www.npmjs.com/package/contrakt) CLI tool. Developers run `contrakt publish` to upload their inferred API contracts, and anyone (human or AI agent) can browse and fetch them.

Live at **[registry.contrakt.dev](https://registry.contrakt.dev)**

## What the registry provides

- A public, agent-readable page for every published API contract
- Immutable publish history with breaking, non-breaking, and documentation-only changes
- A production deployment URL kept separate from `contrakt.lock`
- Generated MCP configuration that targets the selected deployment
- Declared consumer dependencies and `contrakt watch` workflows
- README badges and contract-change webhooks
- Optional x402 pricing with verified Base USDC payment receipts
- An authenticated publisher console for APIs, integrations, tokens, wallet, and monetization

The registry never invents call volume, earnings, agents, or activity. Publisher metrics come from stored contracts, declared dependencies, free-tier usage, and verified payment receipts.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **NextAuth.js v5** (GitHub OAuth)
- **Drizzle ORM** + **@neondatabase/serverless** (Postgres)
- **Coinbase CDP** (optional embedded smart wallets)
- **Onramper** (optional fiat-to-USDC funding)
- **Tailwind CSS**
- **pnpm**

## Setup

### 1. Clone and install dependencies

```bash
cd contrakt-registry
pnpm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `DATABASE_HOSTADDRS` | Optional comma-separated database IP fallbacks for local DNS outages; TLS still validates the hostname in `DATABASE_URL` |
| `AUTH_SECRET` | NextAuth secret (run: `openssl rand -base64 32`) |
| `AUTH_GITHUB_ID` | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App client secret |
| `NEXT_PUBLIC_SITE_URL` | Public landing-page origin (`https://contrakt.dev`) |
| `NEXT_PUBLIC_REGISTRY_URL` | Registry and owner-console origin (`https://registry.contrakt.dev`) |
| `NEXT_PUBLIC_APP_URL` | Legacy alias for `NEXT_PUBLIC_REGISTRY_URL` |

Optional wallet and funding variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CDP_PROJECT_ID` | Coinbase CDP project ID used to create embedded smart wallets |
| `ONRAMPER_API_KEY` | Onramper production widget API key |
| `ONRAMPER_SIGNING_SECRET` | Server-only secret used to sign destination-wallet parameters |
| `ONRAMPER_NETWORK_ID` | Onramper network ID; defaults to `base` |
| `NEXT_PUBLIC_X402_NETWORK` | `base` or `base-sepolia` |
| `NEXT_PUBLIC_USDC_DEPOSIT_URL` | Optional bridge URL used when Onramper is not configured |

### 3. Set up GitHub OAuth App

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: Contrakt Registry
   - **Homepage URL**: `https://registry.contrakt.dev` (or `http://localhost:3000`)
   - **Authorization callback URL**: `https://registry.contrakt.dev/api/auth/callback/github`
4. Copy the **Client ID** and **Client Secret** into your `.env.local`

### 4. Set up Neon Postgres

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string into `DATABASE_URL`

### 5. Apply database migrations

```bash
pnpm exec drizzle-kit migrate
```

Generate a new migration after changing `lib/schema.ts`:

```bash
pnpm db:generate
```

### 6. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Enable embedded wallets and USDC funding (optional)

1. Create a project in [Coinbase Developer Platform](https://portal.cdp.coinbase.com/).
2. Add `http://localhost:3000` and the production registry origin to its allowlist.
3. Set `NEXT_PUBLIC_CDP_PROJECT_ID`.
4. Request Onramper production keys and set `ONRAMPER_API_KEY` plus `ONRAMPER_SIGNING_SECRET`.
5. Restart the development server after changing public environment variables.

With CDP configured, **Connect Wallet** offers an email-based instant wallet alongside browser wallets. With Onramper configured, **Deposit USDC** opens a signed fiat checkout that sends funds directly to the connected wallet. Contrakt does not custody funds.

---

## API Reference

### `POST /api/contracts`

Publish a contract. Used by the `contrakt publish` CLI command.

**Headers:**
```
Authorization: Bearer <api-token>
```

**Body:**
```json
{
  "name": "my-nextjs-app",
  "baseUrl": "https://api.example.com",
  "contract": {
    "stack": "nextjs-app-router",
    "version": "1.0.0",
    "endpoints": [
      {
        "method": "GET",
        "path": "/api/users",
        "description": "List all users",
        "responses": {
          "200": { "description": "OK" }
        }
      }
    ]
  }
}
```

**Response:**
```json
{
  "id": "abc123",
  "url": "https://registry.contrakt.dev/u/username/my-nextjs-app",
  "slug": "username/my-nextjs-app",
  "version": 2,
  "diff": {
    "breaking": [],
    "nonBreaking": [],
    "additive": []
  }
}
```

Each publish stores an immutable `contract_versions` snapshot and sends the version plus change counts to configured webhooks.

### `GET /api/contracts`

Browse published contracts.

**Query params:**
- `q` — search by name/slug
- `stack` — filter by stack (e.g. `nextjs-app-router`)
- `limit` — results per page (default: 20, max: 100)
- `offset` — pagination offset

### `GET /api/contracts/[id]`

Get a single contract by ID (full contract JSON included).

### `GET /api/registry/contracts/[username]/[app]`

Get a published contract by public slug. This is the endpoint used by agents and `contrakt watch`.

**Response:**
```json
{
  "slug": "username/my-nextjs-app",
  "endpointCount": 5,
  "stack": "nextjs-app-router",
  "baseUrl": "https://api.example.com",
  "url": "https://registry.contrakt.dev/u/username/my-nextjs-app",
  "updatedAt": "2026-06-06T00:00:00.000Z",
  "contract": {}
}
```

### `GET /badge/[username]/[app]`

Returns an SVG README badge showing current endpoint count.

```md
[![API contract](https://registry.contrakt.dev/badge/username/my-nextjs-app)](https://registry.contrakt.dev/u/username/my-nextjs-app)
```

### `GET /api/registry/contracts/[username]/[app]/dependencies`

List declared consumers of a published contract.

### `POST /api/registry/contracts/[username]/[app]/dependencies`

Declare that the authenticated token owner depends on a published contract.

**Headers:**
```
Authorization: Bearer <api-token>
```

**Body:**
```json
{
  "consumerName": "my-dashboard",
  "consumerUrl": "https://github.com/me/my-dashboard"
}
```

### `GET /api/registry/contracts/[username]/[app]/webhooks`

List webhook subscriptions for a contract you own.

### `POST /api/registry/contracts/[username]/[app]/webhooks`

Create a webhook subscription for `contract.created` and `contract.updated` events. Owner token required.

**Body:**
```json
{
  "url": "https://example.com/contrakt-webhook",
  "secret": "optional-hmac-secret"
}
```

If `secret` is provided, webhook requests include:

```
X-Contrakt-Signature: sha256=<hmac>
```

### `DELETE /api/registry/contracts/[username]/[app]/webhooks?id=<webhook-id>`

Delete a webhook subscription. Owner token required.

### `POST /api/tokens`

Create a new API token. Requires GitHub login session.

**Response:**
```json
{ "token": "abc123..." }
```

> The token is only returned once. Store it securely.

### `GET /api/tokens`

List your tokens (IDs and creation dates, not token values).

### `DELETE /api/tokens/[id]`

Revoke an API token.

New tokens are stored as SHA-256 hashes. Existing plaintext tokens are migrated to hashed storage when they are next used.

### Owner console

Authenticated GitHub users can manage their APIs through:

- `/dashboard` — portfolio, publishing onboarding, and real aggregate counts
- `/dashboard/settings` — publish tokens, GitHub identity, and settlement wallet
- `/u/[user]/[app]/dashboard` — contract status and publish history
- `/u/[user]/[app]/dashboard/consumers` — declared dependencies
- `/u/[user]/[app]/dashboard/monetization` — x402 pricing and verified receipts
- `/u/[user]/[app]/dashboard/integrations` — deployment URL, MCP, badges, watch command, and webhooks

---

## CLI Usage

Once you have an API token from the dashboard:

```bash
# Publish your contract
contrakt publish --token <your-token>

# Watch a contract you consume
contrakt watch https://registry.contrakt.dev/u/username/my-nextjs-app --depend

# Add a webhook to a contract you own
contrakt webhook https://registry.contrakt.dev/u/username/my-nextjs-app https://example.com/contrakt-webhook
```

---

## Deployment

Deploy to Vercel:

```bash
pnpm dlx vercel
```

Set the same environment variables in the Vercel dashboard.

The database uses Neon's serverless driver which is compatible with Vercel Edge Functions.

---

## Database Schema

```
users          — GitHub user accounts (id = GitHub user ID)
apiTokens      — CLI authentication tokens
contracts      — Published API contracts (slug = username/name)
dependencies   — Consumers that declared they depend on a contract
webhooks       — Publisher-owned webhook subscriptions
```

Run `pnpm db:studio` to open Drizzle Studio and browse your data.
