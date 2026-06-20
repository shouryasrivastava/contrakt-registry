import { NextRequest, NextResponse } from "next/server";
import { ownedContract } from "@/lib/owner-auth";
import { normalizeDeploymentUrl } from "@/lib/deployment-url";
import { assertSafeDeploymentTarget, probeDeployment } from "@/lib/deployment-probe";
import { readJsonBody } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

type Params = Promise<{ username: string; app: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { username, app } = await params;
  const slug = `${username}/${app}`;
  const result = await ownedContract(req, slug);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error === "unauthorized" ? "Sign in or provide a valid publish token." : "Contract not found." },
      { status: result.error === "unauthorized" ? 401 : 404 },
    );
  }
  const limited = await enforceRateLimit({
    namespace: "deployment-test",
    identifier: result.userId,
    limit: 20,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const parsed = await readJsonBody<{ baseUrl?: unknown }>(req, 8_000);
  if (!parsed.ok) return parsed.response;
  const normalized = normalizeDeploymentUrl(parsed.value.baseUrl);
  if (!normalized.ok) {
    return NextResponse.json(
      { status: "invalid", reachable: false, message: normalized.error },
      { status: 400 },
    );
  }

  try {
    const url = new URL(normalized.url);
    await assertSafeDeploymentTarget(url, process.env.NODE_ENV !== "production");
    return NextResponse.json(await probeDeployment(normalized.url));
  } catch (error) {
    return NextResponse.json(
      {
        status: "unsafe",
        reachable: false,
        message: error instanceof Error ? error.message : "This deployment destination cannot be tested safely.",
      },
      { status: 400 },
    );
  }
}
