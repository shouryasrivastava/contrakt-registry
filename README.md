# Contrakt Registry

The public registry for the [`contrakt`](https://www.npmjs.com/package/contrakt) CLI tool. Developers run `contrakt publish` to upload their inferred API contracts, and anyone (human or AI agent) can browse and fetch them.

Live at **[contrakt-registry.vercel.app](https://contrakt-registry.vercel.app)**

## Stack

- **Next.js 15** (App Router, TypeScript)
- **NextAuth.js v5** (GitHub OAuth)
- **Drizzle ORM** + **@neondatabase/serverless** (Postgres)
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
| `AUTH_SECRET` | NextAuth secret (run: `openssl rand -base64 32`) |
| `AUTH_GITHUB_ID` | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App client secret |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL (e.g. `https://registry.contrakt.dev`) |

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

### 5. Push database schema

```bash
pnpm db:push
```

This uses Drizzle Kit to push the schema to your Neon database.

### 6. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

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
  "url": "https://registry.contrakt.dev/c/username/my-nextjs-app",
  "slug": "username/my-nextjs-app"
}
```

### `GET /api/contracts`

Browse published contracts.

**Query params:**
- `q` — search by name/slug
- `stack` — filter by stack (e.g. `nextjs-app-router`)
- `limit` — results per page (default: 20, max: 100)
- `offset` — pagination offset

### `GET /api/contracts/[id]`

Get a single contract by ID (full contract JSON included).

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

---

## CLI Usage

Once you have an API token from the dashboard:

```bash
# Publish your contract
contrakt publish --token <your-token>

# Check your app against a published contract
contrakt check --registry https://registry.contrakt.dev/c/username/my-nextjs-app
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
```

Run `pnpm db:studio` to open Drizzle Studio and browse your data.
