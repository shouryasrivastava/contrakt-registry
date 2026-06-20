"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Terminal, Upload, X } from "lucide-react";
import TokenManager from "./TokenManager";

type Token = {
  id: string;
  tokenPrefix?: string | null;
  createdAt: Date;
};

export default function PublishApiButton({ tokens }: { tokens: Token[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-ink bg-white px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-[#f7f7f7]"
      >
        Publish API
      </button>
      {open ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-[#dce7f5]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[680px] overflow-hidden rounded-[16px] border border-border bg-white shadow-[0_24px_80px_rgba(32,32,32,0.18)]">
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Publish from your repository</p>
                <h2 className="mt-2 text-[28px] leading-none text-ink">Add an API to Contrakt</h2>
                <p className="mt-2 text-[13px] text-muted">Create a token once, then run two commands inside your app.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-0 md:grid-cols-[230px_minmax(0,1fr)]">
              <div className="border-b border-border bg-[#f6f6f6] p-5 md:border-b-0 md:border-r">
                {[
                  [KeyRound, "1", "Create a publish token"],
                  [Terminal, "2", "Infer the contract"],
                  [Upload, "3", "Publish it"],
                ].map(([Icon, step, label]) => {
                  const StepIcon = Icon as typeof KeyRound;
                  return (
                    <div key={String(step)} className="mb-5 flex items-start gap-3 last:mb-0">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-white text-ink shadow-sm">
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Step {String(step)}</p>
                        <p className="mt-1 text-[13px] font-medium text-ink">{String(label)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-5 p-5">
                <TokenManager initialTokens={tokens} compact />
                {[
                  ["init", "contrakt init"],
                  ["publish", "contrakt publish"],
                ].map(([id, command]) => (
                  <div key={id}>
                    <p className="mb-2 text-[12px] font-medium text-ink">
                      {id === "init" ? "From your API project" : "Publish the inferred contract"}
                    </p>
                    <div className="flex items-center gap-3 rounded-[10px] bg-[#171717] px-4 py-3 text-white">
                      <code className="min-w-0 flex-1 truncate text-[12px]">{command}</code>
                      <button type="button" onClick={() => copy(command, id)} aria-label={`Copy ${command}`}>
                        {copied === id ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white/70" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
