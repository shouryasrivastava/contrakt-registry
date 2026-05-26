"use client";

import { useState } from "react";

interface Token {
  id: string;
  createdAt: Date;
}

interface TokenManagerProps {
  initialTokens: Token[];
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

export default function TokenManager({ initialTokens }: TokenManagerProps) {
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
    try {
      const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== id));
        if (newToken) {
          // If the revoked token was the newly created one, clear it
          setNewToken(null);
        }
      }
    } catch {
      // ignore
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
      // fallback
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">API Tokens</h2>
      </div>

      {/* New token display */}
      {newToken && (
        <div className="mb-4 p-4 bg-[#0d1f0d] border border-green-800/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-4 h-4 text-green-400 flex-shrink-0"
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
            <p className="text-sm font-medium text-green-400">Token created!</p>
          </div>
          <p className="text-xs text-yellow-400 mb-3 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            This token won&apos;t be shown again
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-gray-300 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-[#1f1f1f] break-all">
              {newToken}
            </code>
            <button
              onClick={() => copyToClipboard(newToken)}
              className="flex-shrink-0 px-3 py-2 bg-[#111111] border border-[#1f1f1f] text-xs text-gray-300 rounded-lg hover:text-white hover:border-[#2d2d2d] transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Create button */}
      <button
        onClick={createToken}
        disabled={loading}
        className="w-full mb-4 px-4 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            Create API Token
          </>
        )}
      </button>

      {/* Token list */}
      {tokens.length === 0 ? (
        <div className="text-center py-8 bg-[#111111] border border-[#1f1f1f] rounded-xl">
          <p className="text-[#6b7280] text-xs">No tokens yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between p-3 bg-[#111111] border border-[#1f1f1f] rounded-lg"
            >
              <div>
                <p className="text-xs text-gray-400 font-mono">
                  {token.id.slice(0, 8)}...
                </p>
                <p className="text-xs text-[#6b7280] mt-0.5">
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

      {/* Usage hint */}
      <div className="mt-4 p-3 bg-[#111111] border border-[#1f1f1f] rounded-lg">
        <p className="text-xs text-[#6b7280] mb-2">Use in CLI:</p>
        <code className="text-xs font-mono text-gray-400">
          contrakt publish --token &lt;your-token&gt;
        </code>
      </div>
    </div>
  );
}
