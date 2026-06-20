import { afterEach, describe, expect, it } from "vitest";
import { getX402Network } from "@/lib/x402";

const originalNetwork = process.env.X402_NETWORK;
const originalMainnet = process.env.X402_ENABLE_MAINNET;

afterEach(() => {
  process.env.X402_NETWORK = originalNetwork;
  process.env.X402_ENABLE_MAINNET = originalMainnet;
});

describe("x402 launch network", () => {
  it("defaults to Base Sepolia", () => {
    delete process.env.X402_NETWORK;
    expect(getX402Network().name).toBe("base-sepolia");
  });

  it("uses Circle Base Sepolia USDC", () => {
    process.env.X402_NETWORK = "base-sepolia";
    expect(getX402Network().usdcAddress.toLowerCase()).toBe(
      "0x036cbd53842c5426634e7929541ec2318f3dcf7e",
    );
  });
});
