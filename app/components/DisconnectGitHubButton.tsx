"use client";

import { useEffect, useState } from "react";
import { LogOut, X } from "lucide-react";
import { signOut } from "next-auth/react";

export default function DisconnectGitHubButton({
  compact = false,
  onBegin,
}: {
  compact?: boolean;
  onBegin?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function disconnect() {
    setBusy(true);
    onBegin?.();
    await signOut({ redirectTo: "/" });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "flex w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left text-[12px] text-red-700 hover:bg-red-50"
            : "inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2 text-[12px] font-medium text-red-700 hover:bg-red-50"
        }
      >
        <LogOut className="h-3.5 w-3.5" />
        Disconnect GitHub
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[6000] grid place-items-center bg-[#202020]/30 px-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="disconnect-title"
            className="w-full max-w-[420px] rounded-[16px] border border-border bg-white p-5 shadow-[0_24px_80px_rgba(32,32,32,0.18)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">GitHub account</p>
                <h2 id="disconnect-title" className="mt-2 text-[24px] text-ink">Sign out of Contrakt?</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-[13px] leading-6 text-muted">
              This signs you out. Your contracts, tokens, wallets, consumers, and account data remain unchanged.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="rounded-full border border-border px-4 py-2 text-[12px] font-medium text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={disconnect}
                disabled={busy}
                className="rounded-full bg-red-700 px-4 py-2 text-[12px] font-medium text-white disabled:opacity-60"
              >
                {busy ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
