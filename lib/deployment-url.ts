export type DeploymentUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function isLocalHostname(hostname: string): boolean {
  const value = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
}

export function normalizeDeploymentUrl(
  input: unknown,
  { allowLocalhost = process.env.NODE_ENV !== "production" }: { allowLocalhost?: boolean } = {},
): DeploymentUrlResult {
  if (typeof input !== "string" || !input.trim()) {
    return { ok: false, error: "Enter a deployment URL, for example https://api.example.com." };
  }

  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    return { ok: false, error: "Enter a complete URL beginning with https://." };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "Deployment URLs cannot contain credentials." };
  }
  if (parsed.search || parsed.hash) {
    return { ok: false, error: "Remove query parameters and fragments from the deployment URL." };
  }

  const local = isLocalHostname(parsed.hostname);
  if (parsed.protocol !== "https:" && !(allowLocalhost && local && parsed.protocol === "http:")) {
    return {
      ok: false,
      error: allowLocalhost
        ? "Use HTTPS. HTTP is allowed only for localhost during development."
        : "Production deployment URLs must use HTTPS.",
    };
  }

  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  return { ok: true, url: parsed.toString().replace(/\/+$/, "") };
}

export function isUnsafeIpAddress(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  const ipv4 = mapped ?? normalized;
  const parts = ipv4.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19))
  );
}
