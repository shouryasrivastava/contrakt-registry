import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const parsedDatabaseUrl = new URL(databaseUrl);
const fallbackHosts = (process.env.DATABASE_HOSTADDRS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);
const connectionHosts = fallbackHosts.length
  ? fallbackHosts
  : [parsedDatabaseUrl.hostname];
const ssl =
  process.env.DATABASE_SSL === "false"
    ? false
    : {
        rejectUnauthorized: true,
        servername: parsedDatabaseUrl.hostname,
      };

const client = postgres({
  host: connectionHosts.join(","),
  port: Number(parsedDatabaseUrl.port || 5432),
  database: parsedDatabaseUrl.pathname.replace(/^\//, ""),
  username: decodeURIComponent(parsedDatabaseUrl.username),
  password: decodeURIComponent(parsedDatabaseUrl.password),
  ssl,
  max: 3,
  prepare: false,
  connect_timeout: 3,
  idle_timeout: 60,
  max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });

export async function databaseRead<T>(read: () => Promise<T>): Promise<T> {
  return read();
}
