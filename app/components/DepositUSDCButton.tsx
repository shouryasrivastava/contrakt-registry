"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Wallet, X } from "lucide-react";
import { readStoredWallet } from "./wallet-storage";

const IS_TESTNET = process.env.NEXT_PUBLIC_X402_NETWORK === "base-sepolia";
const USDC_ADDRESS = IS_TESTNET
  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const FUNDING_URL =
  process.env.NEXT_PUBLIC_USDC_DEPOSIT_URL ??
  (IS_TESTNET
    ? "https://superbridge.app/?fromChainId=11155111&toChainId=84532"
    : "https://superbridge.app/?fromChainId=1&toChainId=8453");
const RPC_URL = IS_TESTNET ? "https://sepolia.base.org" : "https://mainnet.base.org";

function formatBalance(rawHex: unknown): string {
  if (typeof rawHex !== "string") return "0.00";
  const value = Number(BigInt(rawHex)) / 1_000_000;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

export default function DepositUSDCButton() {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("—");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fundingUrl, setFundingUrl] = useState(FUNDING_URL);
  const [onrampEnabled, setOnrampEnabled] = useState(false);

  useEffect(() => {
    if (!open) return;
    const wallet = readStoredWallet();
    setAddress(wallet?.address ?? null);
    setError(null);
    if (wallet?.address) {
      void loadBalance(wallet.address);
      void loadFundingUrl(wallet.address);
    }
  }, [open]);

  async function loadBalance(walletAddress: string) {
    setBusy(true);
    try {
      const paddedAddress = walletAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0");
      const response = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [
          {
            to: USDC_ADDRESS,
            data: `0x70a08231${paddedAddress}`,
          },
          "latest",
          ],
        }),
      });
      const data = (await response.json()) as { result?: string; error?: { message?: string } };
      if (!response.ok || !data.result) throw new Error(data.error?.message ?? "Balance request failed.");
      setBalance(formatBalance(data.result));
    } catch (cause) {
      setBalance("—");
      setError(cause instanceof Error ? cause.message : "Could not read the USDC balance.");
    } finally {
      setBusy(false);
    }
  }

  async function loadFundingUrl(walletAddress: string) {
    try {
      const response = await fetch(`/api/onramp?address=${encodeURIComponent(walletAddress)}`);
      const data = (await response.json()) as { configured?: boolean; url?: string };
      if (response.ok && data.configured && data.url) {
        setFundingUrl(data.url);
        setOnrampEnabled(true);
      } else {
        setFundingUrl(FUNDING_URL);
        setOnrampEnabled(false);
      }
    } catch {
      setFundingUrl(FUNDING_URL);
      setOnrampEnabled(false);
    }
  }

  function beginDeposit() {
    const wallet = readStoredWallet();
    if (!wallet) {
      document.querySelector<HTMLButtonElement>("[data-connect-wallet]")?.click();
      return;
    }
    setOpen(true);
  }

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <button
        type="button"
        onClick={beginDeposit}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-[16px] border border-border bg-[#e9e9e9] px-4 py-3 text-[13px] font-medium text-ink shadow-[0_1px_3px_rgba(32,32,32,0.04)] transition hover:bg-[#dfdfdf]"
      >
        <Wallet className="h-4.5 w-4.5" />
        Deposit USDC
      </button>

      {open ? (
        <div className="fixed inset-0 z-[1100] grid place-items-center bg-black/25 px-4 backdrop-blur-[2px]">
          <section className="w-full max-w-[440px] rounded-[16px] border border-border bg-white p-5 shadow-[0_24px_80px_rgba(32,32,32,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
                  Fund wallet
                </p>
                <h2 className="mt-1 text-[25px] tracking-[-0.03em] text-ink">Deposit USDC</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close deposit panel"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted hover:bg-[#f3f3f3] hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-[12px] border border-border bg-[#f5f5f5] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] text-muted">Network</span>
                <span className="text-[12px] font-semibold text-ink">
                  {IS_TESTNET ? "Base Sepolia" : "Base"}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[12px] text-muted">USDC balance</p>
                  <p className="mt-1 font-mono text-[28px] tracking-[-0.04em] text-ink">
                    {busy ? "Loading…" : balance}
                  </p>
                </div>
                <span className="pb-1 text-[12px] font-semibold text-muted">USDC</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
                Funding address
              </p>
              <button
                type="button"
                onClick={copyAddress}
                className="mt-2 flex w-full items-center justify-between gap-3 rounded-[10px] border border-border px-3 py-3 text-left hover:bg-[#f8f8f8]"
              >
                <span className="truncate font-mono text-[12px] text-ink">{address}</span>
                {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4 text-muted" />}
              </button>
            </div>

            {error ? <p className="mt-3 text-[12px] leading-relaxed text-[#8a2f18]">{error}</p> : null}

            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              {onrampEnabled
                ? "Buy USDC with a card or bank transfer. Funds go directly to your wallet."
                : "Bridge USDC into this wallet on Base. Contrakt never holds your funds."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => address && loadBalance(address)}
                disabled={busy}
                className="rounded-full border border-[#202020] px-4 py-2.5 text-[13px] font-semibold text-ink disabled:opacity-50"
              >
                Refresh balance
              </button>
              <a
                href={fundingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#202020] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#3a3a3a]"
              >
                {onrampEnabled ? "Buy USDC" : "Open bridge"}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
