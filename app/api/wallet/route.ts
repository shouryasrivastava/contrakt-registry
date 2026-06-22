import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getAddress, isAddress, verifyMessage } from "viem";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userWallets, walletChallenges } from "@/lib/schema";
import { apiError, readJsonBody } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { e2eEnabled } from "@/lib/e2e";

const E2E_SIGNATURE = `0x${"e".repeat(130)}`;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ wallet: null }, { status: 401 });
  }

  let wallet = null;
  try {
    wallet = await db.query.userWallets.findFirst({
      where: eq(userWallets.userId, session.user.id),
      orderBy: [desc(userWallets.updatedAt)],
    });
  } catch {
    return NextResponse.json({ wallet: null, warning: "Wallet lookup unavailable" });
  }

  return NextResponse.json({
    wallet: wallet
      ? {
          address: wallet.address,
          chainId: wallet.chainId,
          updatedAt: wallet.updatedAt,
        }
      : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError(401, "UNAUTHORIZED", "Sign in before connecting a wallet.");
  }
  const limited = await enforceRateLimit({
    namespace: "wallet-verify",
    identifier: session.user.id,
    limit: 10,
    windowSeconds: 300,
  });
  if (limited) return limited;
  const parsed = await readJsonBody<{
    address?: unknown;
    signature?: unknown;
    chainId?: unknown;
  }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  if (typeof body.address !== "string" || !isAddress(body.address)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  if (typeof body.signature !== "string" || !body.signature.startsWith("0x")) {
    return NextResponse.json({ error: "Invalid wallet signature" }, { status: 400 });
  }

  const address = getAddress(body.address);
  let challenge;
  try {
    challenge = await db.query.walletChallenges.findFirst({
      where: and(
        eq(walletChallenges.userId, session.user.id),
        eq(walletChallenges.address, address),
        isNull(walletChallenges.usedAt)
      ),
      orderBy: [desc(walletChallenges.createdAt)],
    });
  } catch (error) {
    console.error("wallet challenge lookup failed", error);
    return NextResponse.json(
      { error: "Wallet verification is temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Wallet challenge expired. Try connecting again." }, { status: 400 });
  }

  let valid = false;
  if (e2eEnabled() && body.signature === E2E_SIGNATURE) {
    valid = true;
  } else {
    try {
      valid = await verifyMessage({
        address: address as `0x${string}`,
        message: challenge.message,
        signature: body.signature as `0x${string}`,
      });
    } catch {
      return NextResponse.json(
        { error: "MetaMask returned an unreadable signature. Reconnect and sign the new message." },
        { status: 400 },
      );
    }
  }

  if (!valid) {
    return NextResponse.json({ error: "Wallet signature did not match this account." }, { status: 400 });
  }

  const chainId = typeof body.chainId === "number" && Number.isFinite(body.chainId) ? body.chainId : null;
  try {
    await db
      .update(walletChallenges)
      .set({ usedAt: new Date() })
      .where(eq(walletChallenges.id, challenge.id));

    const existing = await db.query.userWallets.findFirst({
      where: and(eq(userWallets.userId, session.user.id), eq(userWallets.address, address)),
    });

    if (existing) {
      await db
        .update(userWallets)
        .set({ chainId, updatedAt: new Date() })
        .where(eq(userWallets.id, existing.id));
    } else {
      await db.insert(userWallets).values({
        id: nanoid(),
        userId: session.user.id,
        address,
        chainId,
      });
    }
  } catch (error) {
    console.error("wallet persistence failed", error);
    return NextResponse.json(
      { error: "Your signature was valid, but Contrakt could not save the wallet. Try again shortly." },
      { status: 503 },
    );
  }

  return NextResponse.json({ wallet: { address, chainId } });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  await db.delete(userWallets).where(eq(userWallets.userId, session.user.id));
  return NextResponse.json({ ok: true });
}
