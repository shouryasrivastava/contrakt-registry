# Production operations

## Environments

- `preview`: disposable Vercel preview with no production credentials.
- `staging`: separate Neon database, GitHub OAuth app, Upstash resources, Sentry environment, and Base Sepolia wallets.
- `production`: `https://registry.contrakt.dev`; Base Sepolia only until mainnet is explicitly approved.

Never reuse production database, OAuth, QStash, Redis, wallet, Onramper, or Sentry credentials in preview or staging.

## Release procedure

1. Rotate any credential that has appeared in chat, logs, screenshots, or git history.
2. Back up the production Neon database and record the restore point.
3. Deploy the release commit to staging.
4. Run `pnpm db:migrate`, CI, Playwright, and the CLI staging acceptance flow.
5. Verify `/api/health`, `/api/ready`, Sentry ingestion, Redis rate limits, QStash delivery, GitHub OAuth, wallet connection, and a Base Sepolia payment.
6. Promote the exact tested commit to production.
7. Run non-destructive production smoke tests with the dedicated Contrakt test account.

## Rollback

- Application: promote the previous healthy Vercel deployment.
- Database: migrations must be additive. Restore the Neon release checkpoint only if an additive rollback cannot recover service.
- Payments: set the affected monetization configuration to paused. Do not switch to Base mainnet during an incident.
- Webhooks: disable the affected hook or remove `QSTASH_TOKEN` only after recording queued delivery IDs.

## Incident response

1. Confirm `/api/health` and `/api/ready`.
2. Check Sentry for the release and request ID.
3. Check Vercel function logs, Upstash metrics, QStash delivery logs, and Neon health.
4. Disable the smallest affected feature, communicate degraded behavior, and preserve evidence.
5. Rotate exposed credentials immediately. GitHub OAuth, Neon, API tokens, wallet keys, QStash, Redis, Sentry, and Onramper are separate rotations.

## Required release gates

- TypeScript, lint, unit, integration, production build, and Playwright pass.
- The migration runs against a restored staging copy.
- No webhook can resolve to a private or reserved address.
- A transaction hash cannot produce more than one payment receipt.
- `registry.contrakt.dev` is the only canonical origin in generated output.
- Staging CLI publish, republish, watch, dependency, webhook, MCP, and Sepolia payment flows pass.
