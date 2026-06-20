/**
 * Static hero showcase pieces for the home page (Option 3 — dark, maximal).
 * The "screen" panels (wave, code, flow) are intentionally dark regardless of
 * theme — like a terminal — so they pop on both dark and light backgrounds.
 */
import Link from "next/link";

const EM = "#34d399";

export function AnnouncePill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
      style={{ color: EM, background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.28)" }}
    >
      <span>▸</span>
      <span className="text-sub">{children}</span>
    </span>
  );
}

export function WorksWith() {
  return (
    <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
      <span className="uppercase tracking-wider text-faint">works with</span>
      {["Claude", "Cursor", "MCP", "Cline", "Windsurf"].map((x) => (
        <span key={x} className="text-sub">{x}</span>
      ))}
    </div>
  );
}

/** Supermemory-style animated emerald waveform band. */
export function WaveBand() {
  const bars = Array.from({ length: 72 });
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "#070707", border: "1px solid #1f1f1f", height: 150 }}
    >
      <div className="absolute inset-0 flex items-center justify-center gap-[3px] px-6">
        {bars.map((_, i) => {
          const amp = Math.abs(Math.sin(i * 0.5));
          return (
            <span
              key={i}
              className="animate-pulse rounded-full"
              style={{
                width: 3,
                height: 14 + amp * 78,
                background: `rgba(52,211,153,${0.25 + amp * 0.6})`,
                animationDelay: `${(i % 12) * 80}ms`,
                animationDuration: "1900ms",
              }}
            />
          );
        })}
      </div>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 130%, rgba(52,211,153,0.18), transparent 60%)" }}
      />
    </div>
  );
}

/** The live x402 payment flow — the product's differentiator, as a stepper. */
export function X402Flow({ compact = false }: { compact?: boolean }) {
  const steps = [
    { k: "agent calls tool", v: "GET /api/transcribe", accent: false },
    { k: "402 payment required", v: "0.001 USDC · Base", accent: true },
    { k: "pays on-chain", v: "tx 0x9a3f…c421", accent: true },
    { k: "200 OK", v: '{ text: "…" }', accent: false },
  ];
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 h-full"
      style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.20)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="h-2 w-2 rounded-full" style={{ background: EM, boxShadow: "0 0 0 3px rgba(52,211,153,0.2)" }} />
        <span className="text-[11px] uppercase tracking-wider text-muted font-mono">live x402 payment flow</span>
      </div>
      <div className={`flex ${compact ? "flex-col" : "flex-col sm:flex-row sm:items-stretch"} gap-2`}>
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className="flex-1 rounded-lg px-3 py-2.5" style={{ background: "#111111", border: "1px solid #1f1f1f" }}>
              <p className="text-[10px] uppercase tracking-wider mb-1 font-mono" style={{ color: s.accent ? EM : "#71717a" }}>{s.k}</p>
              <p className="text-xs font-mono" style={{ color: s.accent ? "#fafafa" : "#a1a1aa" }}>{s.v}</p>
            </div>
            {i < steps.length - 1 && <span className={compact ? "hidden" : "hidden sm:block text-[#3f3f46]"}>→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dark code editor panel showing the MCP config to paste into an agent. */
export function McpPanel() {
  return (
    <div className="rounded-2xl overflow-hidden h-full" style={{ background: "#0d0d0d", border: "1px solid #1f1f1f" }}>
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ borderBottom: "1px solid #1f1f1f" }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#27272a" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#27272a" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#27272a" }} />
        <span className="ml-2 text-[11px] text-faint font-mono">claude_desktop_config.json</span>
      </div>
      <pre className="px-4 py-3 text-[12px] leading-[1.7] overflow-x-auto font-mono" style={{ color: "#a1a1aa" }}>
{`{
  "mcpServers": {
    `}<span style={{ color: EM }}>{`"contrakt-registry"`}</span>{`: {
      "command": `}<span style={{ color: "#fafafa" }}>{`"contrakt"`}</span>{`,
      "args": ["run-mcp", `}<span style={{ color: "#fafafa" }}>{`"--slug"`}</span>{`, "alice/api"]
    }
  }
}`}
      </pre>
    </div>
  );
}

export function HeroCtas() {
  return (
    <div className="flex items-center gap-4 text-sm">
      <code className="px-4 py-2.5 rounded-lg font-mono text-ink2" style={{ background: "#111111" }}>
        npm install -g contrakt
      </code>
      <a href="#contracts" className="text-accent hover:underline underline-offset-4">Browse →</a>
      <Link href="https://github.com/shouryasrivastava/contrakt#readme" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-ink transition-colors">
        Docs
      </Link>
    </div>
  );
}
