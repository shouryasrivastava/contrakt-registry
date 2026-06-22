import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isUnsafeIpAddress } from "./deployment-url";
import { e2eDeploymentProbe } from "./e2e";

function isLocalHostname(hostname: string): boolean {
  const value = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
}

export async function assertSafeDeploymentTarget(url: URL, allowLocalhost: boolean): Promise<void> {
  if (e2eDeploymentProbe(url.toString())) return;
  if (isLocalHostname(url.hostname)) {
    if (allowLocalhost) return;
    throw new Error("Localhost deployments cannot be tested in production.");
  }

  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isUnsafeIpAddress(address))) {
    throw new Error("Private-network and reserved deployment addresses cannot be tested.");
  }
}

export type ProbeResult = {
  status: "reachable" | "unreachable" | "timeout" | "authentication-required" | "invalid-certificate";
  reachable: boolean;
  httpStatus?: number;
  latencyMs?: number;
  message: string;
};

function certificateFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("certificate") || message.includes("self signed") || message.includes("tls");
}

export async function probeDeployment(url: string, timeoutMs = 4500): Promise<ProbeResult> {
  const fixture = e2eDeploymentProbe(url);
  if (fixture) return fixture;
  const startedAt = Date.now();
  const request = async (method: "HEAD" | "GET") =>
    fetch(url, {
      method,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: method === "GET" ? { Range: "bytes=0-0" } : undefined,
    });

  try {
    let response = await request("HEAD");
    if (response.status === 405 || response.status === 501) response = await request("GET");
    const latencyMs = Date.now() - startedAt;
    if (response.status === 401 || response.status === 403) {
      return {
        status: "authentication-required",
        reachable: true,
        httpStatus: response.status,
        latencyMs,
        message: "The deployment is reachable and requires authentication.",
      };
    }
    return {
      status: "reachable",
      reachable: true,
      httpStatus: response.status,
      latencyMs,
      message: `Deployment responded with HTTP ${response.status}.`,
    };
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return { status: "timeout", reachable: false, latencyMs: elapsed, message: "The deployment did not respond before the timeout." };
    }
    if (certificateFailure(error)) {
      return { status: "invalid-certificate", reachable: false, latencyMs: elapsed, message: "The deployment TLS certificate is invalid." };
    }
    return { status: "unreachable", reachable: false, latencyMs: elapsed, message: "The deployment could not be reached from Contrakt." };
  }
}
