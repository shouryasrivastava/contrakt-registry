import { apiError } from "./api-response";

type RateLimitOptions = {
  namespace: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
};

export async function enforceRateLimit(options: RateLimitOptions) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV !== "production") return null;
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Rate limiting is not configured for this deployment.",
    );
  }

  const bucket = Math.floor(Date.now() / (options.windowSeconds * 1000));
  const key = `contrakt:${options.namespace}:${options.identifier}:${bucket}`;

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, options.windowSeconds + 5],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) throw new Error(`Upstash returned ${response.status}`);
    const result = (await response.json()) as Array<{ result?: number }>;
    const count = Number(result[0]?.result ?? 0);
    if (count > options.limit) {
      return apiError(429, "RATE_LIMITED", "Too many requests. Try again shortly.");
    }
    return null;
  } catch (error) {
    console.error("[rate-limit] unavailable", error);
    if (process.env.NODE_ENV !== "production") return null;
    return apiError(503, "SERVICE_UNAVAILABLE", "Request protection is temporarily unavailable.");
  }
}

export function requestIdentifier(request: Request): string {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
