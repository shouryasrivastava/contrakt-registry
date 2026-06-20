/**
 * POST /api/registry/contracts/[username]/[app]/payments
 *
 * Agent calls this to submit a payment proof after paying via USDC on Base.
 * We verify the on-chain Transfer event with viem, then record the receipt.
 *
 * Body: { txHash: string, agentId: string }
 * Response 200: { verified: true, receiptId: string }
 * Response 402: { verified: false, reason: string, paymentRequired: { ... } }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, monetizationConfigs, paymentReceipts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  createPublicClient,
  getAddress,
  http,
  isHash,
  parseAbi,
  parseEventLogs,
  parseUnits,
} from "viem";
import { getX402Network, USDC_DECIMALS } from "@/lib/x402";
import { apiError, readJsonBody } from "@/lib/api-response";
import { enforceRateLimit, requestIdentifier } from "@/lib/rate-limit";

type Params = Promise<{ username: string; app: string }>;

const network = getX402Network();

const usdcAbi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

const publicClient = createPublicClient({
  chain: network.chain,
  transport: http(network.rpcUrl),
});

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const limited = await enforceRateLimit({
    namespace: "payment-verify",
    identifier: requestIdentifier(req),
    limit: 20,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const { username, app } = await params;
  const slug = `${username}/${app}`;

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const config = await db.query.monetizationConfigs.findFirst({
    where: eq(monetizationConfigs.contractId, contract.id),
  });
  if (!config || !config.enabled) {
    return NextResponse.json({ error: "Monetization not enabled" }, { status: 400 });
  }

  const parsed = await readJsonBody<{ txHash?: unknown; agentId?: unknown }>(req, 8_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  const { txHash, agentId } = body;

  if (typeof txHash !== "string" || !isHash(txHash)) {
    return apiError(400, "BAD_REQUEST", "txHash must be a valid EVM transaction hash.");
  }
  if (
    typeof agentId !== "string" ||
    !/^[a-zA-Z0-9._:@/-]{1,128}$/.test(agentId)
  ) {
    return apiError(
      400,
      "BAD_REQUEST",
      "agentId must be 1-128 characters using letters, numbers, or ._:@/-.",
    );
  }

  const existing = await db.query.paymentReceipts.findFirst({
    where: eq(paymentReceipts.txHash, txHash),
  });
  if (existing) {
    if (
      existing.monetizationConfigId !== config.id ||
      existing.agentId !== agentId
    ) {
      return apiError(
        409,
        "CONFLICT",
        "This transaction was already used for another payment.",
      );
    }
    return NextResponse.json({
      verified: true,
      receiptId: existing.id,
      note: "Already verified",
    });
  }

  // Verify on-chain Transfer event
  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash,
    });
    if (receipt.status !== "success") {
      return NextResponse.json(
        {
          verified: false,
          reason: "The transaction did not complete successfully.",
          paymentRequired: buildPaymentRequired(config),
        },
        { status: 402 },
      );
    }

    const latestBlock = await publicClient.getBlockNumber();
    const confirmations = latestBlock - receipt.blockNumber + 1n;
    const requiredConfirmations = BigInt(
      Math.max(1, Number(process.env.X402_CONFIRMATIONS ?? "2")),
    );
    if (confirmations < requiredConfirmations) {
      return NextResponse.json(
        {
          verified: false,
          reason: `Payment has ${confirmations} confirmation(s); ${requiredConfirmations} required.`,
          paymentRequired: buildPaymentRequired(config),
        },
        { status: 402 },
      );
    }

    const logs = parseEventLogs({
      abi: usdcAbi,
      eventName: "Transfer",
      logs: receipt.logs.filter(
        (log) => log.address.toLowerCase() === network.usdcAddress.toLowerCase(),
      ),
    });
    const receiver = getAddress(config.receiverAddress);
    const matchingLog = logs.find(
      (log) => getAddress(log.args.to) === receiver,
    );

    if (!matchingLog || !matchingLog.args.value) {
      return NextResponse.json(
        {
          verified: false,
          reason: "No matching USDC Transfer found in transaction",
          paymentRequired: buildPaymentRequired(config),
        },
        { status: 402 }
      );
    }

    // Check amount is >= priceUsd (accounting for USDC 6 decimals)
    const requiredRaw = parseUnits(config.priceUsd, USDC_DECIMALS);
    const paidRaw = matchingLog.args.value;

    if (paidRaw < requiredRaw) {
      return NextResponse.json(
        {
          verified: false,
          reason: `Insufficient payment: expected ${config.priceUsd} USDC, got ${(Number(paidRaw) / 10 ** USDC_DECIMALS).toFixed(6)} USDC`,
          paymentRequired: buildPaymentRequired(config),
        },
        { status: 402 }
      );
    }

    // Record receipt
    const [saved] = await db
      .insert(paymentReceipts)
      .values({
        id: randomUUID(),
        monetizationConfigId: config.id,
        agentId,
        txHash,
        chainId: network.chain.id,
        blockNumber: receipt.blockNumber.toString(),
        amountUsdc: paidRaw.toString(),
      })
      .returning();

    return NextResponse.json({ verified: true, receiptId: saved.id });
  } catch (err) {
    console.error("[payments] viem error:", err);
    const duplicate =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "23505";
    if (duplicate) {
      return apiError(409, "CONFLICT", "This transaction was already used.");
    }
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Payment verification is temporarily unavailable.",
    );
  }
}

function buildPaymentRequired(config: {
  receiverAddress: string;
  priceUsd: string;
  freeTierCalls: number;
}) {
  return {
    network: network.name,
    token: "USDC",
    tokenAddress: network.usdcAddress,
    receiverAddress: config.receiverAddress,
    priceUsd: config.priceUsd,
    instructions: [
      `Send ${config.priceUsd} USDC on ${network.name} to ${config.receiverAddress}`,
      "Then call this endpoint with the txHash to get a receiptId",
      "Include the receiptId as __paymentProof in your tool call args",
    ],
  };
}
