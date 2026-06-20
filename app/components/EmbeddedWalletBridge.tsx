"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  useEvmAddress,
  useIsSignedIn,
  useSignInWithEmail,
  useSignOut,
  useVerifyEmailOTP,
} from "@coinbase/cdp-hooks";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, Mail, Sparkles } from "lucide-react";
import {
  clearStoredWallet,
  EMBEDDED_SIGN_OUT_EVENT,
  writeStoredWallet,
} from "./wallet-storage";

function friendlyAuthError(error: unknown, fallback: string) {
  const apiMessage =
    typeof error === "object" && error !== null && "errorMessage" in error
      ? String((error as { errorMessage?: unknown }).errorMessage ?? "")
      : "";
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : apiMessage;
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid") ||
    normalized.includes("incorrect") ||
    normalized.includes("verification code") ||
    normalized.includes("otp")
  ) {
    return "That code is incorrect or has expired. Check the email and try again.";
  }
  if (normalized.includes("rate") || normalized.includes("too many")) {
    return "Too many attempts. Wait a moment, then request a new code.";
  }
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Could not reach the wallet service. Check your connection and try again.";
  }
  return fallback;
}

export function EmbeddedWalletMonitor({
  onConnected,
}: {
  onConnected?: () => void;
}) {
  const { evmAddress } = useEvmAddress();
  const { isSignedIn } = useIsSignedIn();
  const { signOut } = useSignOut();

  useEffect(() => {
    if (!isSignedIn || !evmAddress) return;
    writeStoredWallet({
      address: evmAddress,
      chainId: 8453,
      source: "embedded",
    });
    onConnected?.();
  }, [evmAddress, isSignedIn, onConnected]);

  useEffect(() => {
    const handleSignOut = () => {
      void signOut().finally(clearStoredWallet);
    };
    window.addEventListener(EMBEDDED_SIGN_OUT_EVENT, handleSignOut);
    return () => window.removeEventListener(EMBEDDED_SIGN_OUT_EVENT, handleSignOut);
  }, [signOut]);

  return null;
}

export function EmbeddedWalletForm({
  onConnected,
}: {
  onConnected?: () => void;
}) {
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { evmAddress } = useEvmAddress();
  const { isSignedIn } = useIsSignedIn();
  const [step, setStep] = useState<"email" | "otp" | "creating" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completionStarted = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !evmAddress || completionStarted.current) return;
    completionStarted.current = true;
    writeStoredWallet({
      address: evmAddress,
      chainId: 8453,
      source: "embedded",
    });
    setStep("success");
    setBusy(false);
    const timeout = window.setTimeout(() => onConnected?.(), 1500);
    return () => window.clearTimeout(timeout);
  }, [evmAddress, isSignedIn, onConnected]);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await signInWithEmail({ email: email.trim() });
      setFlowId(result.flowId);
      setStep("otp");
    } catch (cause) {
      setError(friendlyAuthError(cause, "We could not send a code to that email. Try again."));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the complete 6-digit code from your email.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await verifyEmailOTP({ flowId, otp });
      setStep("creating");
    } catch (cause) {
      setOtp("");
      setError(friendlyAuthError(cause, "We could not verify that code. Request a new one and try again."));
      setBusy(false);
    }
  }

  function editEmail() {
    setStep("email");
    setOtp("");
    setFlowId("");
    setError(null);
  }

  if (step === "success") {
    return (
      <div className="wallet-step-enter flex min-h-[238px] flex-col items-center justify-center px-5 text-center">
        <span className="wallet-success-mark grid h-16 w-16 place-items-center rounded-full bg-[#e9f7ef] text-[#23754a]">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="mt-5 text-[22px] font-medium tracking-[-0.03em] text-ink">Wallet ready</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Your self-custodial wallet was created successfully.
        </p>
        <div className="mt-4 rounded-full border border-[#dce6f2] bg-[#f3f6fa] px-4 py-2 font-mono text-[11px] text-ink">
          {evmAddress ? `${evmAddress.slice(0, 8)}...${evmAddress.slice(-6)}` : "Securing wallet..."}
        </div>
        <p className="mt-4 text-[10px] font-medium text-[#6b7f99]">Opening your wallet details…</p>
      </div>
    );
  }

  if (step === "creating") {
    return (
      <div className="wallet-step-enter flex min-h-[238px] flex-col items-center justify-center px-5 text-center">
        <span className="relative grid h-14 w-14 place-items-center rounded-[16px] bg-[#10264d] text-white">
          <Sparkles className="h-6 w-6" />
          <span className="absolute inset-0 animate-ping rounded-[16px] border border-[#7db5ff]/70" />
        </span>
        <h3 className="mt-5 text-[20px] font-medium tracking-[-0.03em] text-ink">Creating your wallet</h3>
        <p className="mt-2 max-w-[280px] text-[12px] leading-relaxed text-muted">
          Securing a self-custodial wallet on Base. This usually takes a few seconds.
        </p>
        <LoaderCircle className="mt-5 h-5 w-5 animate-spin text-[#2f6fca]" />
      </div>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={verifyCode} className="wallet-step-enter">
        <button
          type="button"
          onClick={editEmail}
          className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Change email
        </button>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-[#e9f2ff] text-[#2f6fca]">
            <Mail className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="text-[16px] font-semibold text-ink">Check your email</h3>
            <p className="mt-0.5 max-w-[270px] truncate text-[11px] text-muted">{email}</p>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-[11px] font-semibold text-ink">6-digit verification code</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={otp}
            onChange={(event) => {
              setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            className="mt-2 h-12 w-full rounded-[10px] border border-border bg-white px-4 font-mono text-[20px] tracking-[0.32em] text-ink outline-none transition focus:border-[#5a8fd8] focus:ring-4 focus:ring-[#8dbbfa]/20"
            placeholder="000000"
          />
        </label>

        {error ? (
          <div role="alert" className="mt-3 rounded-[10px] border border-[#f0c7c0] bg-[#fff4f1] px-3 py-2.5 text-[11px] leading-relaxed text-[#9b3827]">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy || otp.length !== 6}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#10264d] px-4 text-[12px] font-semibold text-white transition hover:bg-[#183866] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {busy ? "Checking code…" : "Verify and create wallet"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="wallet-step-enter">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-[#10264d] text-white">
          <Sparkles className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="text-[16px] font-semibold text-ink">Create instant wallet</h3>
          <p className="mt-0.5 text-[11px] text-muted">No extension or seed phrase needed</p>
        </div>
      </div>

      <label className="mt-5 block">
        <span className="text-[11px] font-semibold text-ink">Email address</span>
        <input
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
          className="mt-2 h-11 w-full rounded-[10px] border border-border bg-white px-3.5 text-[13px] text-ink outline-none transition focus:border-[#5a8fd8] focus:ring-4 focus:ring-[#8dbbfa]/20"
          placeholder="you@example.com"
        />
      </label>

      {error ? (
        <div role="alert" className="mt-3 rounded-[10px] border border-[#f0c7c0] bg-[#fff4f1] px-3 py-2.5 text-[11px] leading-relaxed text-[#9b3827]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy || !email.trim()}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#10264d] px-4 text-[12px] font-semibold text-white transition hover:bg-[#183866] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {busy ? "Sending code…" : "Continue with email"}
      </button>
    </form>
  );
}
