"use client";

import { useState } from "react";

interface Token {
  id: string;
  tokenPrefix?: string | null;
  createdAt: Date;
}

interface TokenManagerProps {
  initialTokens: Token[];
  compact?: boolean;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export default function TokenManager({ initialTokens, compact = false }: TokenManagerProps) {
  const [tokens, setTokens] = useState<Token[]>(initialTokens);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createToken() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tokens", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create token");
        return;
      }
      const data = await res.json();
      setNewToken(data.token);

      // Refresh token list
      const listRes = await fetch("/api/tokens");
      if (listRes.ok) {
        const listData = await listRes.json();
        setTokens(listData.tokens);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function revokeToken(id: string) {
    setRevoking(id);
    setError(null);
    try {
      const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== id));
        if (newToken) {
          // If the revoked token was the newly created one, clear it
          setNewToken(null);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Token revocation failed with HTTP ${res.status}.`);
      }
    } catch {
      setError("Network error while revoking the token. Try again.");
    } finally {
      setRevoking(null);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access was blocked. Select and copy the token manually.");
    }
  }

  return (
    <div>
      {newToken && (
        <div className="mb-4 rounded-[12px] border border-accent/20 bg-accent/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-4 h-4 text-limefg flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium text-limefg">Token created</p>
          </div>
          <p className="text-xs text-muted mb-3 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            This token won&apos;t be shown again
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-ink2 bg-background px-3 py-2.5 rounded-2xl border border-border break-all">
              {newToken}
            </code>
            <button
              onClick={() => copyToClipboard(newToken)}
              className="flex-shrink-0 px-3 py-2.5 bg-surface border border-border text-xs text-ink2 rounded-2xl hover:text-ink hover:border-border2 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={createToken}
        disabled={loading}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create token
          </>
        )}
      </button>

      {tokens.length === 0 ? (
        <div className={`rounded-[12px] border border-border bg-panel text-center ${compact ? "py-4" : "py-8"}`}>
          <p className="text-muted text-sm">No tokens yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-[10px] border border-border bg-panel p-3.5"
            >
              <div>
                <p className="text-xs text-sub font-mono">
                  {token.tokenPrefix ?? `${token.id.slice(0, 8)}...`}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {timeAgo(token.createdAt)}
                </p>
              </div>
              <button
                onClick={() => revokeToken(token.id)}
                disabled={revoking === token.id}
                className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {revoking === token.id ? "..." : "Revoke"}
              </button>
            </div>
          ))}
        </div>
      )}

      {!compact ? (
        <div className="mt-4 rounded-[10px] border border-border bg-panel p-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-faint">CLI</p>
          <code className="break-all font-mono text-xs text-sub">contrakt publish --token &lt;your-token&gt;</code>
        </div>
      ) : null}
    </div>
  );
}
