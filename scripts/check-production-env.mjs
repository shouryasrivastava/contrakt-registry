const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_REGISTRY_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "QSTASH_TOKEN",
  "QSTASH_WORKER_SECRET",
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_CDP_PROJECT_ID",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing production environment variables:\n- ${missing.join("\n- ")}`);
  process.exit(1);
}

const registry = new URL(process.env.NEXT_PUBLIC_REGISTRY_URL);
const site = new URL(process.env.NEXT_PUBLIC_SITE_URL);
if (site.origin !== "https://contrakt.dev") {
  console.error("NEXT_PUBLIC_SITE_URL must be https://contrakt.dev in production.");
  process.exit(1);
}
if (registry.origin !== "https://registry.contrakt.dev") {
  console.error("NEXT_PUBLIC_REGISTRY_URL must be https://registry.contrakt.dev in production.");
  process.exit(1);
}
if ((process.env.X402_NETWORK ?? "base-sepolia") !== "base-sepolia") {
  console.error("Production launch is restricted to X402_NETWORK=base-sepolia.");
  process.exit(1);
}

console.log("Production environment configuration is complete.");
