"use client";

import { useEffect, useState } from "react";

interface Stats {
  contractsPublished: number;
  usdcSettled: number;
  activeAgents: number;
  callsServed24h: number;
}

function fmtUsd(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function plural(n: number, s: string): string {
  return `${n} ${s}${n === 1 ? "" : "s"}`;
}

export default function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/registry/stats", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Stats;
        if (alive) setStats(data);
      } catch {
        /* keep last */
      }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!stats) {
    return <span className="inline-block h-4 w-72 max-w-full rounded bg-hover animate-pulse" />;
  }

  const parts = [
    plural(stats.contractsPublished, "contract"),
    `${fmtUsd(stats.usdcSettled)} USDC settled`,
    plural(stats.activeAgents, "active agent"),
    `${stats.callsServed24h} calls · 24h`,
  ];

  return (
    <p className="font-mono text-sm text-muted leading-6">
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="text-faint px-2">·</span>}
          <span className={i === 1 ? "text-accent" : ""}>{p}</span>
        </span>
      ))}
    </p>
  );
}
