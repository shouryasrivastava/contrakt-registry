import { NextRequest, NextResponse } from "next/server";

export function e2eEnabled(): boolean {
  return (
    process.env.E2E_TEST_MODE === "true" &&
    process.env.VERCEL_ENV !== "production"
  );
}

export function authorizeE2ERequest(request: NextRequest): NextResponse | null {
  if (!e2eEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const expected = process.env.E2E_AUTH_SECRET;
  const provided = request.headers.get("x-contrakt-e2e-key");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return null;
}

export function isE2EUsername(value: string): boolean {
  return /^e2e-(owner|consumer)-[a-z0-9-]{4,80}$/.test(value);
}

export function e2eDeploymentProbe(url: string) {
  if (!e2eEnabled()) return null;

  const hostname = new URL(url).hostname;
  const fixtures = {
    "reachable.e2e.test": {
      status: "reachable",
      reachable: true,
      httpStatus: 200,
      latencyMs: 12,
      message: "Deployment responded with HTTP 200.",
    },
    "authenticated.e2e.test": {
      status: "authentication-required",
      reachable: true,
      httpStatus: 401,
      latencyMs: 12,
      message: "The deployment is reachable and requires authentication.",
    },
    "timeout.e2e.test": {
      status: "timeout",
      reachable: false,
      latencyMs: 4500,
      message: "The deployment did not respond before the timeout.",
    },
    "unreachable.e2e.test": {
      status: "unreachable",
      reachable: false,
      latencyMs: 12,
      message: "The deployment could not be reached from Contrakt.",
    },
    "invalid-certificate.e2e.test": {
      status: "invalid-certificate",
      reachable: false,
      latencyMs: 12,
      message: "The deployment TLS certificate is invalid.",
    },
  } as const;

  return fixtures[hostname as keyof typeof fixtures] ?? null;
}
