"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, Wallet } from "lucide-react";

type Config = {
  receiverAddress: string;
  priceUsd: string;
  freeTierCalls: number;
  enabled: boolean;
} | null;

function sameAddress(left: string, right: string): boolean {
  return Boolean(left && right) && left.toLowerCase() === right.toLowerCase();
}

function shortAddress(address: string): string {
  return `${address.slice(0, 7)}...${address.slice(-5)}`;
}

export default function MonetizationForm({
  slug,
  initial,
  connectedWalletAddress,
}: {
  slug: string;
  initial: Config;
  connectedWalletAddress: string | null;
}) {
  const router = useRouter();
  const [receiverAddress, setReceiverAddress] = useState(initial?.receiverAddress ?? "");
  const [savedReceiverAddress, setSavedReceiverAddress] = useState(initial?.receiverAddress ?? "");
  const [priceUsd, setPriceUsd] = useState(initial?.priceUsd ?? "0.001");
  const [freeTierCalls, setFreeTierCalls] = useState(initial?.freeTierCalls ?? 3);
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const connectedWalletDiffers = useMemo(
    () =>
      Boolean(connectedWalletAddress) &&
      !sameAddress(connectedWalletAddress ?? "", receiverAddress),
    [connectedWalletAddress, receiverAddress],
  );
  const savedReceiverDiffers = useMemo(
    () =>
      Boolean(connectedWalletAddress && savedReceiverAddress) &&
      !sameAddress(connectedWalletAddress ?? "", savedReceiverAddress),
    [connectedWalletAddress, savedReceiverAddress],
  );

  async function save() {
    setState("saving");
    setError(null);
    try {
      const response = await fetch(`/api/registry/contracts/${slug}/monetization`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverAddress, priceUsd, freeTierCalls, enabled }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error ?? "Could not save monetization settings.");
        setState("idle");
        return;
      }
      const savedAddress = payload.monetization?.receiverAddress ?? receiverAddress;
      setReceiverAddress(savedAddress);
      setSavedReceiverAddress(savedAddress);
      setState("saved");
      router.refresh();
      window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setError("Contrakt could not reach the registry. Your payout address was not changed.");
      setState("idle");
    }
  }

  return (
    <div className="space-y-5">
      {savedReceiverDiffers && connectedWalletAddress && connectedWalletDiffers ? (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-amber-950">Connected wallet differs from the payout wallet</p>
              <p className="mt-1 text-[11px] leading-5 text-amber-900">
                Payments still go to {shortAddress(savedReceiverAddress)} until you switch the receiver and save.
              </p>
              <button
                type="button"
                onClick={() => {
                  setReceiverAddress(connectedWalletAddress);
                  setError(null);
                  setState("idle");
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-950 px-3.5 py-2 text-[11px] font-medium text-white"
              >
                <Wallet className="h-3.5 w-3.5" />
                Use connected wallet
              </button>
            </div>
          </div>
        </div>
      ) : savedReceiverDiffers && connectedWalletAddress ? (
        <div className="rounded-[9px] border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
          Receiver updated in the form. Save pricing to route future payments to {shortAddress(connectedWalletAddress)}.
        </div>
      ) : connectedWalletAddress ? (
        <div className="flex items-center gap-2 rounded-[9px] border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-800">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Connected wallet is the payout receiver.
        </div>
      ) : (
        <div className="rounded-[9px] border border-border bg-[#fafafa] px-3 py-2 text-[11px] text-muted">
          Connect a wallet from the navigation bar to select it as the receiver.
        </div>
      )}
      <label className="block">
        <span className="text-[12px] font-medium text-ink">Receiver wallet</span>
        <input
          value={receiverAddress}
          onChange={(event) => setReceiverAddress(event.target.value)}
          placeholder="0x..."
          className="mt-2 w-full rounded-[9px] border border-border bg-[#fafafa] px-3.5 py-3 font-mono text-[12px] text-ink outline-none focus:border-[#999]"
        />
        <span className="mt-1.5 block text-[10px] text-faint">USDC payments are verified on Base and sent to this address.</span>
        {connectedWalletDiffers && connectedWalletAddress ? (
          <span className="mt-1.5 block text-[10px] text-amber-700">
            This address is not your currently connected wallet.
          </span>
        ) : null}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[12px] font-medium text-ink">Price per call (USDC)</span>
          <input
            value={priceUsd}
            onChange={(event) => setPriceUsd(event.target.value)}
            inputMode="decimal"
            className="mt-2 w-full rounded-[9px] border border-border bg-[#fafafa] px-3.5 py-3 font-mono text-[12px] text-ink outline-none focus:border-[#999]"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-ink">Free calls per agent</span>
          <input
            value={freeTierCalls}
            onChange={(event) => setFreeTierCalls(Number(event.target.value))}
            type="number"
            min={0}
            className="mt-2 w-full rounded-[9px] border border-border bg-[#fafafa] px-3.5 py-3 font-mono text-[12px] text-ink outline-none focus:border-[#999]"
          />
        </label>
      </div>
      <label className="flex items-center justify-between gap-4 rounded-[10px] border border-border bg-[#fafafa] px-4 py-3">
        <span>
          <span className="block text-[12px] font-medium text-ink">Accept paid calls</span>
          <span className="mt-1 block text-[10px] text-faint">Pause this without deleting your pricing configuration.</span>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="h-4 w-4 accent-[#ff682c]"
        />
      </label>
      {error ? <p className="rounded-[8px] bg-red-50 px-3 py-2 text-[11px] text-red-700">{error}</p> : null}
      <button
        type="button"
        onClick={save}
        disabled={state === "saving"}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[12px] font-medium text-white disabled:opacity-60"
      >
        {state === "saved" ? <CheckCircle2 className="h-4 w-4" /> : null}
        {state === "saving" ? "Saving..." : state === "saved" ? "Saved" : "Save pricing"}
      </button>
    </div>
  );
}
