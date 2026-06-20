import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getAddress, isAddress } from "viem";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { walletChallenges } from "@/lib/schema";
import { apiError, readJsonBody } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";

function buildWalletMessage({
  domain,
  address,
  nonce,
}: {
  domain: string;
  address: string;
  nonce: string;
}) {
  return [
    `${domain} wants you to connect your wallet to Contrakt.`,
    "",
    "This signature only proves wallet ownership. It does not send a transaction or grant spending permission.",
    "",
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError(401, "UNAUTHORIZED", "Sign in before connecting a wallet.");
  }
  const limited = await enforceRateLimit({
    namespace: "wallet-challenge",
    identifier: session.user.id,
    limit: 10,
    windowSeconds: 300,
  });
  if (limited) return limited;
  const parsed = await readJsonBody<{ address?: unknown }>(req, 4_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  if (typeof body.address !== "string" || !isAddress(body.address)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const address = getAddress(body.address);
  const nonce = nanoid(24);
  const message = buildWalletMessage({
    domain: req.nextUrl.host,
    address,
    nonce,
  });

  try {
    await db.insert(walletChallenges).values({
      id: nanoid(),
      userId: session.user.id,
      address,
      nonce,
      message,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
  } catch (error) {
    console.error("wallet challenge insert failed", error);
    return NextResponse.json(
      { error: "Wallet verification is temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  return NextResponse.json({ address, message, nonce });
}
