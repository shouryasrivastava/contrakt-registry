import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError(401, "UNAUTHORIZED", "Sign in before funding a wallet.");
  }
  const limited = await enforceRateLimit({
    namespace: "onramp-url",
    identifier: session.user.id,
    limit: 20,
    windowSeconds: 3600,
  });
  if (limited) return limited;
  const apiKey = process.env.ONRAMPER_API_KEY;
  const signingSecret = process.env.ONRAMPER_SIGNING_SECRET;
  const rawAddress = req.nextUrl.searchParams.get("address");

  if (!apiKey || !signingSecret) {
    return NextResponse.json({ configured: false });
  }

  if (!rawAddress || !isAddress(rawAddress)) {
    return NextResponse.json({ error: "A valid wallet address is required." }, { status: 400 });
  }

  const address = getAddress(rawAddress);
  const network = process.env.ONRAMPER_NETWORK_ID || "base";
  const networkWallets = `${network.toLowerCase()}:${address}`;
  const signature = createHmac("sha256", signingSecret).update(`networkWallets=${networkWallets}`).digest("hex");

  const url = new URL("https://buy.onramper.com/");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("mode", "buy");
  url.searchParams.set("defaultFiat", "USD");
  url.searchParams.set("defaultAmount", "50");
  url.searchParams.set("onlyCryptoNetworks", network.toLowerCase());
  url.searchParams.set("networkWallets", networkWallets);
  url.searchParams.set("signature", signature);
  url.searchParams.set("redirectAtCheckout", "false");
  url.searchParams.set("partnerContext", `contrakt-${address.toLowerCase()}`);

  return NextResponse.json({ configured: true, url: url.toString() });
}
