/**
 * x402 network configuration.
 *
 * Lets the registry verify payments on Base Sepolia by default. Mainnet
 * requires an explicit production opt-in.
 * Base Sepolia testnet, controlled entirely by env vars so no code change is
 * needed to switch networks.
 *
 *   X402_NETWORK   "base" (default) | "base-sepolia"
 *   X402_RPC_URL   optional RPC override for the selected network
 *   X402_USDC_ADDRESS  optional USDC token-address override
 *
 * USDC always has 6 decimals on both networks.
 */

import { base, baseSepolia } from "viem/chains";
import type { Chain } from "viem";

export const USDC_DECIMALS = 6;

// Circle's canonical USDC token addresses.
const USDC_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export interface X402Network {
  /** "base" | "base-sepolia" */
  name: string;
  /** viem chain object */
  chain: Chain;
  /** RPC endpoint */
  rpcUrl: string;
  /** USDC token contract address (lowercase-insensitive) */
  usdcAddress: `0x${string}`;
  /** Block explorer base URL for tx links */
  explorerTxBase: string;
}

export function getX402Network(): X402Network {
  const network = (process.env.X402_NETWORK ?? "base-sepolia").toLowerCase();

  if (network === "base-sepolia" || network === "basesepolia" || network === "sepolia") {
    return {
      name: "base-sepolia",
      chain: baseSepolia,
      rpcUrl: process.env.X402_RPC_URL ?? "https://sepolia.base.org",
      usdcAddress: (process.env.X402_USDC_ADDRESS ?? USDC_BASE_SEPOLIA) as `0x${string}`,
      explorerTxBase: "https://sepolia.basescan.org/tx",
    };
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.X402_ENABLE_MAINNET !== "true"
  ) {
    throw new Error(
      "Base mainnet payments are disabled. Set X402_NETWORK=base-sepolia or explicitly enable mainnet.",
    );
  }

  return {
    name: "base",
    // BASE_RPC_URL kept for backward compatibility with the original env var.
    chain: base,
    rpcUrl: process.env.X402_RPC_URL ?? process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
    usdcAddress: (process.env.X402_USDC_ADDRESS ?? USDC_MAINNET) as `0x${string}`,
    explorerTxBase: "https://basescan.org/tx",
  };
}
