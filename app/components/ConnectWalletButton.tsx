"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Check, Copy, ExternalLink, LoaderCircle, LogOut, RefreshCw, ShieldCheck, Wallet, X } from "lucide-react";
import {
  clearStoredWallet,
  EMBEDDED_SIGN_OUT_EVENT,
  readStoredWallet,
  type StoredWallet,
  WALLET_UPDATED_EVENT,
  writeStoredWallet,
} from "./wallet-storage";
import {
  type AnnouncedProvider,
  selectMetaMaskProvider,
  walletErrorMessage,
} from "./injected-wallet";

const EmbeddedWalletMonitor = dynamic(
  () => import("./EmbeddedWalletBridge").then((module) => module.EmbeddedWalletMonitor),
  { ssr: false }
);
const EmbeddedWalletForm = dynamic(
  () => import("./EmbeddedWalletBridge").then((module) => module.EmbeddedWalletForm),
  { ssr: false }
);
const CDPProviders = dynamic(() => import("./CDPProviders"), { ssr: false });

const BASE_RPC_URL = "https://mainnet.base.org";
const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

type WalletState =
  | { status: "disconnected" }
  | ({ status: "connected" } & StoredWallet)
  | { status: "error"; message: string };

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function normalizeChainId(value: unknown): number | null {
  if (typeof value === "string") {
    return Number.parseInt(value, value.startsWith("0x") ? 16 : 10);
  }
  if (typeof value === "number") return value;
  return null;
}

export default function ConnectWalletButton() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletState>({ status: "disconnected" });
  const [busy, setBusy] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [embeddedFormOpen, setEmbeddedFormOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [balances, setBalances] = useState<{ usdc: string; eth: string } | null>(null);
  const [balanceBusy, setBalanceBusy] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [announcedProviders, setAnnouncedProviders] = useState<AnnouncedProvider[]>([]);
  const [e2eEmail, setE2eEmail] = useState("");
  const [e2eOtp, setE2eOtp] = useState("");
  const [e2eStep, setE2eStep] = useState<"email" | "otp">("email");
  const [e2eError, setE2eError] = useState<string | null>(null);
  const e2eWalletEnabled = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true";
  const embeddedWalletEnabled =
    Boolean(process.env.NEXT_PUBLIC_CDP_PROJECT_ID) || e2eWalletEnabled;

  useEffect(() => {
    setMounted(true);
    const syncWallet = () => {
      const stored = readStoredWallet();
      setWallet(stored ? { status: "connected", ...stored } : { status: "disconnected" });
    };
    syncWallet();
    window.addEventListener(WALLET_UPDATED_EVENT, syncWallet);
    return () => window.removeEventListener(WALLET_UPDATED_EVENT, syncWallet);
  }, []);

  useEffect(() => {
    const onProvider = (event: WindowEventMap["eip6963:announceProvider"]) => {
      setAnnouncedProviders((current) =>
        current.some(({ info }) => info.uuid === event.detail.info.uuid)
          ? current
          : [...current, event.detail],
      );
    };
    window.addEventListener("eip6963:announceProvider", onProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", onProvider);
  }, []);

  const label = useMemo(() => {
    if (busy) return "Connecting...";
    if (wallet.status === "connected") return "Wallet";
    return "Connect Wallet";
  }, [busy, wallet]);

  async function connectExternal() {
    setBusy(true);
    setWallet({ status: "disconnected" });
    try {
      const sessionRes = await fetch("/api/wallet", { cache: "no-store" });
      if (sessionRes.status === 401) {
        router.push(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const provider = selectMetaMaskProvider(announcedProviders, window.ethereum);
      if (!provider) {
        setWallet({
          status: "error",
          message: embeddedWalletEnabled
            ? "MetaMask was not detected. Unlock the extension, refresh this page, or create an instant wallet."
            : "MetaMask was not detected. Install or unlock MetaMask, then refresh this page.",
        });
        return;
      }

      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0];
      if (!address) throw new Error("No wallet account selected.");

      const chainId = normalizeChainId(await provider.request({ method: "eth_chainId" }));

      const nonceRes = await fetch("/api/wallet/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (nonceRes.status === 401) {
        router.push(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const nonceData = (await nonceRes.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!nonceRes.ok || !nonceData.message) {
        throw new Error(
          nonceData.error ??
            (nonceRes.status >= 500
              ? "Contrakt could not save the wallet challenge. Try again in a moment."
              : "Could not create wallet challenge."),
        );
      }

      const signature = await provider.request({
        method: "personal_sign",
        params: [nonceData.message, address],
      });
      if (typeof signature !== "string" || !signature.startsWith("0x")) {
        throw new Error("MetaMask did not return a valid signature. Unlock it and try again.");
      }

      const verifyRes = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, chainId }),
      });

      const verifyData = (await verifyRes.json().catch(() => ({}))) as {
        wallet?: { address: string; chainId: number | null };
        error?: string;
      };

      if (!verifyRes.ok || !verifyData.wallet) {
        throw new Error(verifyData.error ?? "Wallet verification failed.");
      }

      const storedWallet: StoredWallet = { ...verifyData.wallet, source: "external" };
      setWallet({ status: "connected", ...storedWallet });
      writeStoredWallet(storedWallet);
      setChooserOpen(false);
    } catch (error) {
      setWallet({
        status: "error",
        message: walletErrorMessage(error),
      });
    } finally {
      setBusy(false);
    }
  }

  async function connectEmbeddedE2E() {
    if (e2eOtp !== "123456") {
      setE2eError("Incorrect code. Use 123456 for the deterministic E2E wallet.");
      return;
    }
    setBusy(true);
    setE2eError(null);
    try {
      const address = "0x4444444444444444444444444444444444444444";
      const nonceRes = await fetch("/api/wallet/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const nonceData = await nonceRes.json().catch(() => ({}));
      if (!nonceRes.ok || !nonceData.message) {
        throw new Error(nonceData.error ?? "Could not create wallet challenge.");
      }
      const verifyRes = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature: `0x${"e".repeat(130)}`,
          chainId: 84532,
        }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || !verifyData.wallet) {
        throw new Error(verifyData.error ?? "Wallet verification failed.");
      }
      const storedWallet: StoredWallet = {
        ...verifyData.wallet,
        source: "embedded",
      };
      writeStoredWallet(storedWallet);
      setWallet({ status: "connected", ...storedWallet });
      setChooserOpen(false);
      setEmbeddedFormOpen(false);
    } catch (error) {
      setE2eError(
        error instanceof Error ? error.message : "Wallet creation failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      if (wallet.status === "connected" && wallet.source === "embedded") {
        window.dispatchEvent(new Event(EMBEDDED_SIGN_OUT_EVENT));
      } else {
        await fetch("/api/wallet", { method: "DELETE" });
      }
      clearStoredWallet();
      setWallet({ status: "disconnected" });
      setAccountOpen(false);
    } catch (error) {
      setWallet({
        status: "error",
        message: error instanceof Error ? error.message : "Wallet disconnect failed. Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  const handleEmbeddedConnected = useCallback(() => {
    setChooserOpen(false);
    setEmbeddedFormOpen(false);
    setWallet((current) => {
      const stored = readStoredWallet();
      return stored ? { status: "connected", ...stored } : current;
    });
  }, []);

  async function copyAddress() {
    if (wallet.status !== "connected") return;
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  const rpcRequest = useCallback(async (method: string, params: unknown[]) => {
    const response = await fetch(BASE_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const data = (await response.json()) as { result?: string; error?: { message?: string } };
    if (!response.ok || !data.result) {
      throw new Error(data.error?.message ?? "Balance request failed.");
    }
    return data.result;
  }, []);

  const loadBalances = useCallback(async (address: string) => {
    setBalanceBusy(true);
    setBalanceError(false);
    try {
      const paddedAddress = address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
      const [rawEth, rawUsdc] = await Promise.all([
        rpcRequest("eth_getBalance", [address, "latest"]),
        rpcRequest("eth_call", [
          {
            to: BASE_USDC_ADDRESS,
            data: `0x70a08231${paddedAddress}`,
          },
          "latest",
        ]),
      ]);

      const eth = Number(BigInt(rawEth)) / 1e18;
      const usdc = Number(BigInt(rawUsdc)) / 1e6;
      setBalances({
        usdc: usdc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
        eth: eth.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 }),
      });
    } catch {
      setBalanceError(true);
    } finally {
      setBalanceBusy(false);
    }
  }, [rpcRequest]);

  useEffect(() => {
    if (!accountOpen || wallet.status !== "connected") return;
    void loadBalances(wallet.address);
  }, [accountOpen, loadBalances, wallet]);

  useEffect(() => {
    if (!chooserOpen && !accountOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setChooserOpen(false);
      setAccountOpen(false);
      setEmbeddedFormOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [accountOpen, chooserOpen]);

  const activeModal = chooserOpen || accountOpen;

  return (
    <div className="relative">
      <button
        type="button"
        data-connect-wallet
        onClick={() => {
          if (wallet.status === "connected") {
            setAccountOpen(true);
          } else {
            setWallet({ status: "disconnected" });
            setEmbeddedFormOpen(false);
            setChooserOpen(true);
          }
        }}
        disabled={busy}
        title={wallet.status === "connected" ? "View wallet details" : "Connect crypto wallet"}
        className={`wallet-trigger inline-flex items-center gap-2 rounded-full bg-[#202020] px-5 py-2 text-[13px] font-medium text-white transition hover:bg-[#3a3a3a] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 ${
          activeModal ? "wallet-trigger-active" : ""
        }`}
      >
        <Wallet className="h-4 w-4" />
        {label}
      </button>
      {wallet.status === "error" ? (
        <p className="absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-[10px] border border-border bg-white p-3 text-[12px] leading-[1.4] text-[#8a2f18] shadow-[0_8px_24px_rgba(32,32,32,0.08)]">
          {wallet.message}
        </p>
      ) : null}

      {embeddedWalletEnabled && (chooserOpen || accountOpen) ? (
        <CDPProviders>
          <EmbeddedWalletMonitor onConnected={handleEmbeddedConnected} />
        </CDPProviders>
      ) : null}

      {mounted && chooserOpen
        ? createPortal(
        <div
          className="wallet-backdrop fixed inset-0 z-[5000] grid place-items-center overflow-y-auto bg-[#0b2857]/42 px-4 py-8 backdrop-blur-[7px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setChooserOpen(false);
              setEmbeddedFormOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-connect-title"
            className="wallet-dialog my-auto w-full max-w-[430px] rounded-[18px] border border-white/70 bg-[#f8fafc] p-5 shadow-[0_30px_100px_rgba(7,25,54,0.32)]"
          >
            <div className="flex items-start justify-between gap-4 px-1 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#54729b]">Wallet</p>
                <h2 id="wallet-connect-title" className="mt-1 text-[24px] tracking-[-0.03em] text-ink">
                  {embeddedFormOpen ? "Create your wallet" : "How do you want to connect?"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChooserOpen(false);
                  setEmbeddedFormOpen(false);
                }}
                aria-label="Close wallet options"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-white text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {embeddedFormOpen ? (
              <div>
                <div className="rounded-[14px] border border-[#dce6f2] bg-white p-4">
                  {e2eWalletEnabled ? (
                    <div className="space-y-3">
                      {e2eStep === "email" ? (
                        <>
                          <label className="block text-[11px] font-medium text-muted">
                            Email
                            <input
                              type="email"
                              value={e2eEmail}
                              onChange={(event) => setE2eEmail(event.target.value)}
                              className="mt-1 w-full rounded-[9px] border border-border px-3 py-2 text-ink"
                            />
                          </label>
                          <button
                            type="button"
                            disabled={!e2eEmail.includes("@")}
                            onClick={() => setE2eStep("otp")}
                            className="w-full rounded-full bg-ink px-4 py-2.5 text-[12px] font-medium text-white disabled:opacity-50"
                          >
                            Continue
                          </button>
                        </>
                      ) : (
                        <>
                          <label className="block text-[11px] font-medium text-muted">
                            Verification code
                            <input
                              inputMode="numeric"
                              value={e2eOtp}
                              onChange={(event) => {
                                setE2eOtp(event.target.value);
                                setE2eError(null);
                              }}
                              className="mt-1 w-full rounded-[9px] border border-border px-3 py-2 text-ink"
                            />
                          </label>
                          {e2eError ? (
                            <p role="alert" className="text-[11px] text-red-700">
                              {e2eError}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            onClick={connectEmbeddedE2E}
                            disabled={busy}
                            className="w-full rounded-full bg-ink px-4 py-2.5 text-[12px] font-medium text-white disabled:opacity-50"
                          >
                            {busy ? "Creating wallet..." : "Create wallet"}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <CDPProviders>
                      <EmbeddedWalletForm onConnected={handleEmbeddedConnected} />
                    </CDPProviders>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-medium text-[#6b7f99]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secured by Coinbase
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
              {embeddedWalletEnabled ? (
                <button
                  type="button"
                  onClick={() => setEmbeddedFormOpen(true)}
                  className="group flex w-full items-center gap-3 rounded-[12px] border border-[#dce6f2] bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[#a9c5e8] hover:shadow-[0_10px_24px_rgba(35,83,145,0.10)]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#10264d] text-white">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ink">Create instant wallet</span>
                    <span className="mt-0.5 block text-[11px] text-muted">Continue with email, no extension needed</span>
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={connectExternal}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-[12px] border border-[#dce6f2] bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[#a9c5e8] hover:shadow-[0_10px_24px_rgba(35,83,145,0.10)] disabled:opacity-60"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#ececec] text-ink">
                  <Wallet className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-ink">
                    {busy ? "Waiting for wallet…" : "Connect existing wallet"}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                    MetaMask and browser wallet extensions
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </span>
              </button>
              </div>
            )}

            {!embeddedWalletEnabled ? (
              <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted">
                Instant wallets become available after adding a Coinbase CDP project ID.
              </p>
            ) : !embeddedFormOpen ? (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-medium text-[#6b7f99]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secured by Coinbase
              </div>
            ) : null}
            {wallet.status === "error" ? (
              <div role="alert" className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-5 text-red-800">
                {wallet.message}
              </div>
            ) : null}
          </section>
        </div>,
        document.body
      )
        : null}

      {mounted && accountOpen && wallet.status === "connected"
        ? createPortal(
            <div
              className="wallet-backdrop fixed inset-0 z-[5000] grid place-items-center overflow-y-auto bg-[#0b2857]/42 px-4 py-8 backdrop-blur-[7px]"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setAccountOpen(false);
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="wallet-details-title"
                className="wallet-dialog my-auto w-full max-w-[420px] rounded-[18px] border border-white/70 bg-[#f8fafc] p-5 shadow-[0_30px_100px_rgba(7,25,54,0.32)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#54729b]">Connected wallet</p>
                    <h2 id="wallet-details-title" className="mt-1 text-[24px] tracking-[-0.03em] text-ink">
                      Wallet details
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAccountOpen(false)}
                    aria-label="Close wallet details"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-white text-muted hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 rounded-[14px] border border-[#dce6f2] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-[#10264d] text-white">
                      <Wallet className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-ink">{truncateAddress(wallet.address)}</p>
                        <span className="rounded-full bg-[#e9f7ef] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#23754a]">
                          Connected
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">
                        {wallet.source === "embedded" ? "Contrakt embedded wallet" : "External wallet"} · Base
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={copyAddress}
                    className="mt-4 flex w-full items-center justify-between gap-3 rounded-[10px] bg-[#f3f6fa] px-3 py-3 text-left transition hover:bg-[#eaf0f7]"
                  >
                    <span className="truncate font-mono text-[11px] text-ink">{wallet.address}</span>
                    {copied ? <Check className="h-4 w-4 text-[#23754a]" /> : <Copy className="h-4 w-4 shrink-0 text-muted" />}
                  </button>

                  <div className="mt-4 rounded-[11px] border border-[#e4ebf3] bg-[#f7f9fc] p-3.5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-faint">Balance on Base</p>
                      <button
                        type="button"
                        onClick={() => loadBalances(wallet.address)}
                        disabled={balanceBusy}
                        aria-label="Refresh wallet balance"
                        title="Refresh wallet balance"
                        className="grid h-7 w-7 place-items-center rounded-full text-muted transition hover:bg-white hover:text-ink disabled:opacity-50"
                      >
                        {balanceBusy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {balanceError ? (
                      <p className="mt-2 text-[11px] text-[#9b3827]">Balance temporarily unavailable. Try refreshing.</p>
                    ) : (
                      <div className="mt-2 flex items-end justify-between gap-4">
                        <div>
                          <p className="font-mono text-[24px] tracking-[-0.04em] text-ink">
                            {balanceBusy && !balances ? "—" : balances?.usdc ?? "0.00"}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold text-muted">USDC</p>
                        </div>
                        <div className="pb-0.5 text-right">
                          <p className="font-mono text-[13px] text-ink">
                            {balanceBusy && !balances ? "—" : balances?.eth ?? "0.0000"}
                          </p>
                          <p className="mt-0.5 text-[9px] text-muted">ETH for gas</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-faint">Network</p>
                      <p className="mt-1 text-[12px] font-medium text-ink">Base</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-faint">Wallet type</p>
                      <p className="mt-1 text-[12px] font-medium text-ink">
                        {wallet.source === "embedded" ? "Smart wallet" : "Browser wallet"}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-muted">
                  Contrakt uses this wallet for USDC deposits and x402 payments. Your funds remain self-custodial.
                </p>

                <button
                  type="button"
                  onClick={disconnect}
                  disabled={busy}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#efc6bf] bg-[#fff5f2] text-[12px] font-semibold text-[#a33b29] transition hover:bg-[#ffebe6] disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {busy ? "Disconnecting…" : "Disconnect wallet"}
                </button>
              </section>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
