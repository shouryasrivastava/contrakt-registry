/**
 * Canonical, production-facing registry URL used in all user-facing copy and
 * code snippets. Never emit localhost in published content.
 *
 *   NEXT_PUBLIC_REGISTRY_URL  (preferred)
 *   NEXT_PUBLIC_APP_URL       (legacy fallback)
 *   https://registry.contrakt.dev (default)
 */
const DEFAULT_SITE_URL = "https://contrakt.dev";
const DEFAULT_REGISTRY_URL = "https://registry.contrakt.dev";

function normalizeOrigin(value: string): string {
  const parsed = new URL(value);
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("Registry URL must be an origin without a path, query, or fragment.");
  }
  return parsed.origin;
}

export const REGISTRY_URL = normalizeOrigin(
  process.env.NEXT_PUBLIC_REGISTRY_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    DEFAULT_REGISTRY_URL,
);

export const SITE_URL = normalizeOrigin(
  process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
);

export function registryUrl(path = "/"): string {
  return new URL(path, `${REGISTRY_URL}/`).toString();
}

/** Canonical path for a contract detail page (moved from /c to /u). */
export function contractPath(slug: string): string {
  return `/u/${slug}`;
}

/** Absolute canonical URL for a contract. */
export function contractUrl(slug: string): string {
  return `${REGISTRY_URL}${contractPath(slug)}`;
}
