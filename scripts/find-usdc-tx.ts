/**
 * Throwaway helper: find a recent real USDC Transfer on Base mainnet so we can
 * test the payment-verification path without spending any money.
 *
 * Prints: txHash, to (recipient), value (USDC).
 * Usage: npx tsx scripts/find-usdc-tx.ts
 */
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { base } from "viem/chains";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

const client = createPublicClient({
  chain: base,
  transport: http(process.env.X402_RPC_URL ?? "https://mainnet.base.org"),
});

async function main() {
  const latest = await client.getBlockNumber();
  // Scan a small recent window for Transfer events.
  const logs = await client.getLogs({
    address: USDC,
    event: abi[0],
    fromBlock: latest - 3n,
    toBlock: latest,
  });

  // Pick the first transfer with a non-trivial value (>= 0.001 USDC).
  const min = 1000n; // 0.001 * 1e6
  const pick = logs.find((l) => (l.args.value ?? 0n) >= min);

  if (!pick) {
    console.error("No suitable USDC transfer found in recent blocks; try again.");
    process.exit(1);
  }

  console.log(JSON.stringify({
    txHash: pick.transactionHash,
    to: pick.args.to,
    value: pick.args.value?.toString(),
    valueUsdc: formatUnits(pick.args.value ?? 0n, 6),
  }, null, 2));
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
