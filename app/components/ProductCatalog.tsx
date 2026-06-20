"use client";

import { useState } from "react";
import { X402Flow, McpPanel } from "./HeroBits";

const EM = "#34d399";

interface Item {
  id: string;
  title: string;
  blurb: string;
  panel: React.ReactNode;
}

function CodeScreen({ title, lines }: { title: string; lines: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden h-full" style={{ background: "#0d0d0d", border: "1px solid #1f1f1f" }}>
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ borderBottom: "1px solid #1f1f1f" }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#27272a" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#27272a" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#27272a" }} />
        <span className="ml-2 text-[11px] text-faint font-mono">{title}</span>
      </div>
      <pre className="px-4 py-3 text-[12px] leading-[1.7] overflow-x-auto font-mono text-sub">{lines}</pre>
    </div>
  );
}

const ITEMS: Item[] = [
  {
    id: "infer",
    title: "Infer contracts",
    blurb: "Scan your Next.js routes — we read the actual handler code with ts-morph and emit JSON Schema. No hand-written specs.",
    panel: (
      <CodeScreen
        title="contrakt.lock"
        lines={
          <>
            {`{
  "path": "/api/users/[id]",
  `}<span style={{ color: EM }}>{`"responseSchema"`}</span>{`: {
    "type": "object",
    "properties": { "id": `}<span style={{ color: "#fafafa" }}>{`"string"`}</span>{`, "name": `}<span style={{ color: "#fafafa" }}>{`"string"`}</span>{` }
  }
}`}
          </>
        }
      />
    ),
  },
  {
    id: "track",
    title: "Track drift",
    blurb: "Re-run on every change. We classify breaking / non-breaking / additive and fail CI when a contract breaks.",
    panel: (
      <CodeScreen
        title="contrakt check"
        lines={
          <>
            <span className="text-faint">{`$ contrakt check\n`}</span>
            <span style={{ color: EM }}>{`  + added  GET /api/search (non-breaking)\n`}</span>
            <span style={{ color: "#fafafa" }}>{`  ~ changed  POST /api/users  body.email now required\n`}</span>
            <span className="text-muted">{`  ✗ 1 breaking change — exit 1`}</span>
          </>
        }
      />
    ),
  },
  {
    id: "expose",
    title: "Expose as MCP",
    blurb: "Generate an MCP server so any agent — Claude, Cursor, Cline — calls your endpoints as native tools.",
    panel: <McpPanel />,
  },
  {
    id: "monetize",
    title: "Monetize via x402",
    blurb: "Charge per call in USDC on Base. A free tier, then pay-per-call — settled wallet-to-wallet. No keys, no signup.",
    panel: <X402Flow compact />,
  },
  {
    id: "discover",
    title: "Discover & search",
    blurb: "Published contracts are searchable and callable through the registry meta-MCP, so agents find your API on their own.",
    panel: (
      <CodeScreen
        title="registry search"
        lines={
          <>
            <span className="text-faint">{`> search_registry("transcription")\n\n`}</span>
            <span style={{ color: "#fafafa" }}>{`  alice/whisper-api   `}</span><span style={{ color: EM }}>{`0.002 USDC\n`}</span>
            <span style={{ color: "#fafafa" }}>{`  bob/speech-to-text  `}</span><span style={{ color: EM }}>{`0.001 USDC\n`}</span>
            <span style={{ color: "#fafafa" }}>{`  carol/audio-tools   `}</span><span className="text-muted">{`Free`}</span>
          </>
        }
      />
    ),
  },
];

export default function ProductCatalog() {
  const [active, setActive] = useState(ITEMS[3].id); // default: Monetize
  const current = ITEMS.find((i) => i.id === active) ?? ITEMS[0];

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-5 items-stretch">
      <div className="space-y-px">
        {ITEMS.map((it, i) => {
          const on = it.id === active;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setActive(it.id)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors"
              style={{
                background: on ? "rgba(52,211,153,0.08)" : "transparent",
                color: on ? "#fafafa" : "#a1a1aa",
                border: on ? "1px solid rgba(52,211,153,0.25)" : "1px solid transparent",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span className="text-[11px]" style={{ color: on ? EM : "#52525b" }}>0{i + 1}</span>
              {it.title}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl p-5 sm:p-6" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid #1f1f1f" }}>
        <p className="text-[11px] uppercase tracking-wider mb-2 font-mono" style={{ color: EM }}>
          {current.title}
        </p>
        <p className="text-sm text-sub leading-[1.6] mb-5 max-w-lg">{current.blurb}</p>
        {current.panel}
      </div>
    </div>
  );
}
