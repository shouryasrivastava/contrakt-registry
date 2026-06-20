CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
  "id" text PRIMARY KEY NOT NULL,
  "webhook_id" text NOT NULL REFERENCES "webhooks"("id") ON DELETE cascade,
  "event" text NOT NULL,
  "payload" jsonb NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "response_code" integer,
  "last_error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "delivered_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN IF NOT EXISTS "chain_id" integer;
--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN IF NOT EXISTS "block_number" text;
--> statement-breakpoint
UPDATE "payment_receipts" SET "chain_id" = 84532 WHERE "chain_id" IS NULL;
--> statement-breakpoint
UPDATE "payment_receipts" SET "block_number" = '0' WHERE "block_number" IS NULL;
--> statement-breakpoint
ALTER TABLE "payment_receipts" ALTER COLUMN "chain_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "payment_receipts" ALTER COLUMN "block_number" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_receipts_tx_hash_unique" ON "payment_receipts" ("tx_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "free_tier_usage_agent_date_unique"
ON "free_tier_usage" ("monetization_config_id", "agent_id", "date");
