import Pill from "./Pill";

export interface Monetization {
  priceUsd: string;
  freeTierCalls: number;
  network: string;
}

/**
 * One pill style. Monetized → accent pill with the price; free → plain pill.
 * No emoji, no filled background — the accent text carries it.
 */
export default function MonetizationBadge({
  monetization,
}: {
  monetization: Monetization | null;
  size?: "sm" | "md"; // accepted for call-site compatibility; styling is unified
}) {
  if (!monetization) return <Pill>Free</Pill>;
  const { priceUsd, freeTierCalls, network } = monetization;
  return (
    <Pill
      accent
      title={`Pay-per-call via x402. Free tier: ${freeTierCalls} calls/agent/day · ${network}.`}
    >
      <span className="font-mono normal-case tracking-normal">{priceUsd} USDC</span>
    </Pill>
  );
}
