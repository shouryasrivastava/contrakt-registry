import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiTokens = pgTable("api_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").unique(),
  tokenHash: text("token_hash").unique(),
  tokenPrefix: text("token_prefix"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userWallets = pgTable(
  "user_wallets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    chainId: integer("chain_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userAddressUnique: uniqueIndex("user_wallets_user_address_unique").on(table.userId, table.address),
  })
);

export const walletChallenges = pgTable("wallet_challenges", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  nonce: text("nonce").notNull(),
  message: text("message").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contracts = pgTable("contracts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  contract: jsonb("contract").notNull(),
  endpointCount: integer("endpoint_count").notNull().default(0),
  stack: text("stack"),
  description: text("description"),
  baseUrl: text("base_url"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contractVersions = pgTable(
  "contract_versions",
  {
    id: text("id").primaryKey(),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    contract: jsonb("contract").notNull(),
    endpointCount: integer("endpoint_count").notNull().default(0),
    diff: jsonb("diff"),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
  },
  (table) => ({
    contractVersionUnique: uniqueIndex("contract_versions_contract_version_unique").on(
      table.contractId,
      table.version,
    ),
  }),
);

// Consumers that explicitly depend on a published contract. This gives
// publishers visibility into who they may break when the contract changes.
export const contractDependencies = pgTable("contract_dependencies", {
  id: text("id").primaryKey(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contracts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  consumerName: text("consumer_name").notNull(),
  consumerUrl: text("consumer_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
});

// Publisher-owned webhook subscriptions for contract publish/update events.
export const webhooks = pgTable("webhooks", {
  id: text("id").primaryKey(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contracts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secret: text("secret"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: text("id").primaryKey(),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("queued"),
    attemptCount: integer("attempt_count").notNull().default(0),
    responseCode: integer("response_code"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deliveredAt: timestamp("delivered_at"),
  },
  (table) => ({
    webhookDeliveryUnique: uniqueIndex("webhook_deliveries_id_unique").on(table.id),
  }),
);

// ── x402 monetization ──────────────────────────────────────────────────────

export const monetizationConfigs = pgTable("monetization_configs", {
  id: text("id").primaryKey(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contracts.id, { onDelete: "cascade" }),
  receiverAddress: text("receiver_address").notNull(), // EVM address, checksummed
  priceUsd: text("price_usd").notNull(),               // e.g. "0.001"
  freeTierCalls: integer("free_tier_calls").notNull().default(3),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// One row per on-chain payment verified by Contrakt
export const paymentReceipts = pgTable(
  "payment_receipts",
  {
    id: text("id").primaryKey(),
    monetizationConfigId: text("monetization_config_id")
      .notNull()
      .references(() => monetizationConfigs.id, { onDelete: "cascade" }),
    agentId: text("agent_id").notNull(),
    txHash: text("tx_hash").notNull(),
    chainId: integer("chain_id").notNull(),
    blockNumber: text("block_number").notNull(),
    amountUsdc: text("amount_usdc").notNull(),
    verifiedAt: timestamp("verified_at").defaultNow().notNull(),
  },
  (table) => ({
    paymentTxHashUnique: uniqueIndex("payment_receipts_tx_hash_unique").on(table.txHash),
  }),
);

// Free-tier call tracking: (configId, agentId, calendarDate) → count
export const freeTierUsage = pgTable(
  "free_tier_usage",
  {
    id: text("id").primaryKey(),
    monetizationConfigId: text("monetization_config_id")
      .notNull()
      .references(() => monetizationConfigs.id, { onDelete: "cascade" }),
    agentId: text("agent_id").notNull(),
    date: text("date").notNull(),
    callCount: integer("call_count").notNull().default(0),
  },
  (table) => ({
    freeTierAgentDateUnique: uniqueIndex("free_tier_usage_agent_date_unique").on(
      table.monetizationConfigId,
      table.agentId,
      table.date,
    ),
  }),
);

// ── inferred types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
export type UserWallet = typeof userWallets.$inferSelect;
export type WalletChallenge = typeof walletChallenges.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type ContractVersion = typeof contractVersions.$inferSelect;
export type ContractDependency = typeof contractDependencies.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type MonetizationConfig = typeof monetizationConfigs.$inferSelect;
export type PaymentReceipt = typeof paymentReceipts.$inferSelect;
export type FreeTierUsage = typeof freeTierUsage.$inferSelect;
