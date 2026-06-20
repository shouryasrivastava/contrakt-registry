"use client";

import { useState, type ReactNode } from "react";
import CopyButton from "./CopyButton";

// Methods are muted mono caps — no color, no box. Mutating verbs read slightly
// brighter via opacity so the eye can still scan them.
function methodColor(method: string): string {
  const m = method.toUpperCase();
  return m === "GET" ? "text-muted" : "text-sub";
}

// Status codes via opacity, not hue: 2xx normal, others dimmed.
function codeColor(code: string): string {
  return code.startsWith("2") ? "text-sub" : "text-faint";
}

export interface EndpointCardProps {
  method: string;
  path: string;
  description?: string;
  statusCodes: string[];
  priceUsd?: string | null;
  curl: string;
  requestSchema?: ReactNode;
  responseSchema?: ReactNode;
}

export default function EndpointCard(props: EndpointCardProps) {
  const { method, path, description, statusCodes, priceUsd, curl, requestSchema, responseSchema } = props;
  const [open, setOpen] = useState(false);
  const [tryOpen, setTryOpen] = useState(false);

  return (
    <div className="rounded-xl border border-transparent transition-colors hover:border-border hover:bg-hover/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-3 text-left"
      >
        <span className={`w-10 shrink-0 text-[11px] font-mono uppercase tracking-[0.14em] ${methodColor(method)}`}>
          {method.toUpperCase()}
        </span>
        <code className="text-[13px] text-ink font-mono truncate">{path}</code>
        {description && (
          <span className="text-[13px] text-muted truncate hidden sm:inline">— {description}</span>
        )}
        {priceUsd && (
          <span className="ml-auto text-[10px] font-mono text-accent shrink-0">{priceUsd} USDC</span>
        )}
        <svg
          className={`h-3.5 w-3.5 text-faint shrink-0 transition-transform ${priceUsd ? "" : "ml-auto"} ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-4 pt-1 space-y-3">
          {description && (
            <p className="pt-2 text-[13px] leading-relaxed text-muted sm:hidden">{description}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap pt-2.5 border-t border-border">
            <span className="text-[10px] uppercase tracking-[0.15em] text-faint">Status</span>
            {statusCodes.length ? statusCodes.map((c) => (
              <span key={c} className={`rounded-full border border-border px-2 py-1 text-[10px] font-mono ${codeColor(c)}`}>{c}</span>
            )) : <span className="text-[10px] text-faint font-mono">200</span>}
            <button
              type="button"
              onClick={() => setTryOpen(true)}
              className="ml-auto rounded-full border border-border bg-panel px-2.5 py-1.5 text-[10px] text-ink hover:border-border2 hover:bg-hover transition-colors"
            >
              Try endpoint
            </button>
          </div>

          {requestSchema && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-faint mb-1.5">Request schema</p>
              {requestSchema}
            </div>
          )}
          {responseSchema && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-faint mb-1.5">Response schema</p>
              {responseSchema}
            </div>
          )}
          {!requestSchema && !responseSchema && (
            <p className="text-xs text-faint">No schema captured for this endpoint.</p>
          )}
        </div>
      )}

      {tryOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setTryOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[24px] border border-border bg-surface overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono uppercase tracking-wider ${methodColor(method)}`}>
                  {method.toUpperCase()}
                </span>
                <code className="text-sm text-ink font-mono">{path}</code>
              </div>
              <button type="button" onClick={() => setTryOpen(false)} className="text-muted hover:text-ink">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-faint">curl</p>
                  <CopyButton text={curl} />
                </div>
                <pre className="rounded-2xl border border-border bg-inset px-4 py-3 overflow-x-auto text-[12px] leading-[1.6] font-mono text-ink2 whitespace-pre-wrap break-all">
                  {curl}
                </pre>
              </div>
              {priceUsd ? (
                <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
                  <p className="text-xs text-limefg font-medium mb-1">Paid endpoint ({priceUsd} USDC)</p>
                  <p className="text-xs text-muted leading-relaxed">
                    After your free-tier calls, the agent receives a <span className="font-mono text-ink2">PAYMENT_REQUIRED</span> response.
                    Pay the listed USDC on Base to the publisher&apos;s wallet, then retry with
                    {" "}<span className="font-mono text-ink2">__paymentProof</span> in the tool args. The x402 middleware verifies the
                    on-chain transfer before serving the call.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted leading-relaxed">
                  This endpoint is free to call. Point the base URL at the running app and invoke it directly.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
