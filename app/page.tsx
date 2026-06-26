"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";

const githubUrl = "https://github.com/shouryasrivastava/contrakt";
const registryOrigin = process.env.NEXT_PUBLIC_REGISTRY_URL || "https://registry.contrakt.dev";
const githubLoginHref = `${registryOrigin}/sign-in?next=${encodeURIComponent("/dashboard")}`;
const mono = "'JetBrains Mono', 'DM Mono', monospace";

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function ProductCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-xl ${className}`}
      style={{
        background: "#0f1011",
        boxShadow: "inset 0 0 0 1px rgb(35, 37, 42), 0 2px 4px rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </div>
  );
}

function CodeRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md px-4 py-3" style={{ background: "#161718", border: "1px solid #23252a" }}>
      {children}
    </div>
  );
}

function DarkNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#23252a]/80 bg-[#08090a]/85 backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/contrakt-logo-white.png" alt="Contrakt" width={34} height={34} />
          <span className="text-[24px] font-bold leading-none tracking-[-0.55px] text-[#f7f8f8]">Contrakt</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          <a href={`${githubUrl}#readme`} className="text-[13px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]">Docs</a>
          <Link href="/registry" className="text-[13px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]">Registry</Link>
          <a href={githubUrl} className="text-[13px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]">GitHub</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href={githubLoginHref} className="hidden text-[13px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8] sm:block">Login</a>
          <a href={githubLoginHref} className="rounded-md bg-[#f36127] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
            Get started
          </a>
        </div>
      </div>
    </header>
  );
}

function ContraktVisual() {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setCycle((value) => value + 1), 5500);
    return () => window.clearInterval(id);
  }, []);

  const source = [
    [{ c: "#4a5060", t: "// app/api/orders/route.ts" }],
    [],
    [{ c: "#62666d", t: "import" }, { c: "#d0d6e0", t: " { NextRequest }" }, { c: "#62666d", t: " from" }, { c: "#8a9060", t: " 'next/server'" }],
    [{ c: "#62666d", t: "import" }, { c: "#d0d6e0", t: " { db }" }, { c: "#62666d", t: " from" }, { c: "#8a9060", t: " '@/lib/db'" }],
    [],
    [{ c: "#62666d", t: "export async function " }, { c: "#f36127", t: "POST" }, { c: "#8a8f98", t: "(" }],
    [{ c: "#8a8f98", t: "  req: " }, { c: "#ca8a04", t: "NextRequest" }],
    [{ c: "#8a8f98", t: ") {" }],
    [{ c: "#8a8f98", t: "  const body = " }, { c: "#62666d", t: "await" }, { c: "#d0d6e0", t: " req.json()" }],
    [{ c: "#8a8f98", t: "  const {" }],
    [{ c: "#d0d6e0", t: "    product_id, quantity, currency" }],
    [{ c: "#8a8f98", t: "  } = body" }],
    [],
    [{ c: "#8a8f98", t: "  const order = " }, { c: "#62666d", t: "await" }, { c: "#d0d6e0", t: " db.orders" }],
    [{ c: "#d0d6e0", t: "    .create({ product_id, quantity," }],
    [{ c: "#d0d6e0", t: "               currency })" }],
    [],
    [{ c: "#8a8f98", t: "  return " }, { c: "#ca8a04", t: "Response" }, { c: "#d0d6e0", t: ".json({ order })" }],
    [{ c: "#8a8f98", t: "}" }],
  ];

  const contract = [
    "{",
    '  "method": "POST",',
    '  "path": "/api/orders",',
    '  "input": {',
    '    "product_id": { "type": "string",  "required": true },',
    '    "quantity":   { "type": "integer", "min": 1 },',
    '    "currency":   { "type": "string",  "format": "iso-4217" }',
    "  },",
    '  "output": {',
    '    "order": { "type": "Order", "status": 201 }',
    "  },",
    '  "auth": "none"',
    "}",
  ];

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ background: "#0b0c0e", boxShadow: "inset 0 0 0 1px #1e2024, 0 4px 32px rgba(0,0,0,0.55)" }}
    >
      <style>{`
        @keyframes scan-beam { 0%{top:-8%;opacity:0} 4%{opacity:1} 92%{opacity:1} 100%{top:108%;opacity:0} }
        @keyframes line-in { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes badge-in { from{opacity:0} to{opacity:1} }
        @keyframes blink-dot { 0%,100%{opacity:1} 50%{opacity:.2} }
      `}</style>

      <div className="flex items-center gap-2 border-b border-[#1e2024] bg-[#090a0c] px-[18px] py-[10px]">
        <span className="h-[11px] w-[11px] rounded-full bg-[#3a2020]" />
        <span className="h-[11px] w-[11px] rounded-full bg-[#3a3020]" />
        <span className="h-[11px] w-[11px] rounded-full bg-[#1a3020]" />
        <span className="ml-3 text-[12px] text-[#4a4d55]" style={{ fontFamily: mono }}>contrakt scan ./src/app/api</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[#f36127]" style={{ fontFamily: mono }}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#f36127]" style={{ animation: "blink-dot 1.4s ease infinite" }} />
          scanning
        </span>
      </div>

      <div className="grid min-h-[300px] grid-cols-1 md:grid-cols-[55%_45%]">
        <div className="relative overflow-hidden border-b border-[#1a1d22] p-[18px] md:border-b-0 md:border-r">
          <div className="mb-3.5 border-b border-[#1e2024] pb-2.5 text-[11px] text-[#62666d]" style={{ fontFamily: mono }}>
            <span className="text-[#d0d6e0]">route.ts</span>
            <span className="ml-2 text-[#3a3d44]">layout.tsx</span>
            <span className="ml-2 text-[#3a3d44]">page.tsx</span>
          </div>
          <div
            key={`beam-${cycle}`}
            className="pointer-events-none absolute left-0 right-0 h-9"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(243,97,39,0.055) 40%, rgba(243,97,39,0.09) 50%, rgba(243,97,39,0.055) 60%, transparent)",
              animation: "scan-beam 4.8s cubic-bezier(0.4,0,0.6,1) 0.4s forwards",
            }}
          />
          {source.map((parts, index) => (
            <div key={index} className="min-h-5 whitespace-pre text-[12.5px] leading-[1.65]" style={{ fontFamily: mono }}>
              {parts.length === 0 ? "\u00a0" : parts.map((part, partIndex) => <span key={partIndex} style={{ color: part.c }}>{part.t}</span>)}
            </div>
          ))}
        </div>

        <div className="bg-[#0d0e11] p-[18px]">
          <div className="mb-3.5 flex gap-3.5 border-b border-[#1e2024] pb-2.5 text-[11px]" style={{ fontFamily: mono }}>
            <span className="text-[#f36127]">contract.json</span>
            <span className="text-[#3a3d44]">openapi.yaml</span>
          </div>
          {contract.map((line, index) => (
            <div
              key={`${cycle}-${line}-${index}`}
              className="whitespace-pre text-[12.5px] leading-[1.65] opacity-0"
              style={{
                fontFamily: mono,
                color:
                  index === 0 || index === contract.length - 1
                    ? "#8a8f98"
                    : line.includes('"method"') || line.includes('"path"')
                      ? "#d0d6e0"
                      : line.includes('"input"') || line.includes('"output"')
                        ? "#ca8a04"
                        : "#9a9690",
                animation: `line-in 0.35s ease ${0.6 + index * 0.14}s forwards`,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 border-t border-[#1a1d22] bg-[#090a0c] px-5 py-2.5">
        {["contract.json", "openapi.yaml", "mcp-manifest.json"].map((file, index) => (
          <span
            key={`${cycle}-${file}`}
            className="text-[11px] text-[#27a644] opacity-0"
            style={{ fontFamily: mono, animation: `badge-in 0.3s ease ${2.8 + index * 0.18}s forwards` }}
          >
            ✓ {file}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-[#3a3d44]" style={{ fontFamily: mono }}>12 endpoints · 0 errors</span>
      </div>
    </div>
  );
}

function ScanPanel() {
  return (
    <ProductCard>
      <div className="border-b border-[#23252a] px-4 py-3">
        <span className="text-[12px] text-[#62666d]" style={{ fontFamily: mono }}>terminal</span>
      </div>
      <div className="space-y-3 p-5" style={{ fontFamily: mono }}>
        <div className="text-[13px] text-[#62666d]"><span className="text-[#f36127]">❯ </span>contrakt scan ./src</div>
        <div className="text-[13px] text-[#62666d]">Detected: <span className="text-[#f7f8f8]">Next.js App Router</span></div>
        <div className="text-[13px] text-[#62666d]">Scanning <span className="text-[#f7f8f8]">app/api/**</span></div>
        {[
          ["app/api/users/[id]/route.ts", "GET", "User"],
          ["app/api/orders/route.ts", "GET POST", "Order[]"],
          ["app/api/products/[id]/route.ts", "GET PUT DELETE", "Product"],
        ].map(([file, method, ret]) => (
          <CodeRow key={file}>
            <div className="text-[12px] text-[#8a8f98]">{file}</div>
            <div className="mt-1 flex gap-3 text-[11px]">
              <span className="text-[#f36127]">{method}</span>
              <span className="text-[#62666d]">→ <span className="text-[#d0d6e0]">{ret}</span></span>
            </div>
          </CodeRow>
        ))}
        <div className="space-y-1 pt-2 text-[12px]">
          <div className="text-[#27a644]">✓ <span className="text-[#8a8f98]">12 endpoints · contract.json written</span></div>
          <div className="text-[#27a644]">✓ <span className="text-[#8a8f98]">openapi.yaml written</span></div>
          <div className="text-[#27a644]">✓ <span className="text-[#8a8f98]">mcp-manifest.json — 12 tools</span></div>
        </div>
      </div>
    </ProductCard>
  );
}

function McpPanel() {
  return (
    <ProductCard>
      <div className="border-b border-[#23252a] px-4 py-3">
        <span className="text-[12px] text-[#62666d]" style={{ fontFamily: mono }}>mcp-manifest.json</span>
      </div>
      <div className="p-5" style={{ fontFamily: mono }}>
        <div className="mb-3 text-[13px] text-[#62666d]"><span className="text-[#f36127]">❯ </span>contrakt mcp</div>
        <CodeRow>
          <pre className="overflow-x-auto text-[12px] leading-relaxed text-[#8a8f98]">{`{
  "schema_version": "1.0",
  "name": "storefront-api",
  "tools": [
    {
      "name": "create_order",
      "description": "Place a new order",
      "inputSchema": {
        "required": ["product_id"],
        "properties": {
          "product_id": { "type": "string" },
          "quantity":   { "type": "integer" },
          "currency":   { "type": "string" }
        }
      }
    }
  ]
}`}</pre>
        </CodeRow>
        <div className="mt-4 space-y-1 text-[12px]">
          <div className="text-[#27a644]">✓ <span className="text-[#8a8f98]">mcp-manifest.json — 12 tools</span></div>
          <div className="text-[#62666d]">Works with Claude · Cursor · Codex · GPT</div>
        </div>
      </div>
    </ProductCard>
  );
}

function DriftPanel() {
  return (
    <ProductCard>
      <div className="border-b border-[#23252a] px-4 py-3">
        <span className="text-[12px] text-[#62666d]" style={{ fontFamily: mono }}>terminal</span>
      </div>
      <div className="space-y-3 p-5" style={{ fontFamily: mono }}>
        <div className="text-[13px] text-[#62666d]"><span className="text-[#f36127]">❯ </span>contrakt check</div>
        <div className="text-[13px] text-[#62666d]">Comparing <span className="text-[#f7f8f8]">v1.0.3</span> → <span className="text-[#f7f8f8]">HEAD</span></div>
        {["GET  /api/users/[id]", "GET  /api/orders", "POST /api/orders"].map((path) => (
          <div key={path} className="flex justify-between text-[12px] text-[#62666d]">
            <span>{path}</span>
            <span>unchanged</span>
          </div>
        ))}
        <CodeRow>
          <div className="mb-2 flex justify-between text-[12px]">
            <span className="text-[#eb5757]">PUT /api/products/[id]</span>
            <span className="font-medium text-[#eb5757]">CHANGED</span>
          </div>
          <div className="space-y-1 border-l-2 border-[#eb5757] pl-3 text-[11px]">
            <div className="text-[#eb5757]">{'- "price": { "type": "number" }'}</div>
            <div className="text-[#27a644]">
              {'+ "amount": { "type": "number" }'} <span className="text-[#62666d]">← renamed</span>
            </div>
            <div className="text-[#27a644]">{'+ "currency": { "type": "string", "required": true }'}</div>
          </div>
        </CodeRow>
        <div className="space-y-1 text-[12px]">
          <div className="text-[#eb5757]">✗ 2 breaking changes</div>
          <div className="text-[#62666d]">2 consumers subscribed · notifying now</div>
        </div>
      </div>
    </ProductCard>
  );
}

function RegistryPanel() {
  return (
    <ProductCard>
      <div className="border-b border-[#23252a] px-4 py-3">
        <span className="text-[12px] text-[#62666d]" style={{ fontFamily: mono }}>registry.contrakt.dev</span>
      </div>
      <div className="p-5" style={{ fontFamily: mono }}>
        <div className="mb-3 text-[13px] text-[#62666d]"><span className="text-[#f36127]">❯ </span>contrakt publish</div>
        <div className="mb-4 text-[13px] text-[#62666d]">Publishing <span className="text-[#f7f8f8]">storefront-api@1.0.4</span>...</div>
        <CodeRow>
          <div className="mb-3 flex items-center justify-between border-b border-[#23252a] pb-3">
            <span className="text-[14px] font-medium text-[#f7f8f8]">storefront-api</span>
            <span className="rounded bg-[#f36127]/15 px-2 py-0.5 text-[11px] font-medium text-[#f36127]">MCP</span>
          </div>
          <div className="space-y-2 text-[12px]">
            {[
              ["Version", "1.0.4"],
              ["Endpoints", "12"],
              ["Consumers", "3 subscribed"],
              ["Drift events", "0"],
            ].map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-[#62666d]">{key}</span>
                <span className="text-[#8a8f98]">{value}</span>
              </div>
            ))}
          </div>
        </CodeRow>
        <div className="mt-4 space-y-1 text-[12px]">
          <div className="text-[#27a644]">✓ <span className="text-[#8a8f98]">registry.contrakt.dev/you/storefront-api</span></div>
          <div className="text-[#62666d]">Agents can now discover this API</div>
        </div>
      </div>
    </ProductCard>
  );
}

function FeatureSection({
  label,
  headline,
  body,
  linkText,
  linkHref,
  panel,
  flip = false,
}: {
  label: string;
  headline: string;
  body: string;
  linkText?: string;
  linkHref?: string;
  panel: React.ReactNode;
  flip?: boolean;
}) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className="transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
    >
      <div className={`grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20 ${flip ? "lg:grid-flow-dense" : ""}`}>
        <div className={flip ? "lg:col-start-2" : ""}>
          <p className="mb-5 text-[12px] uppercase tracking-widest text-[#f36127]" style={{ fontFamily: mono }}>{label}</p>
          <h2 className="mb-6 whitespace-pre-line text-[clamp(36px,5vw,48px)] font-light leading-[1.2] tracking-[-0.624px] text-[#f7f8f8]">{headline}</h2>
          <p className="mb-7 max-w-sm text-[17px] leading-[1.6] text-[#8a8f98]">{body}</p>
          {linkText && linkHref ? (
            <Link href={linkHref} className="group inline-flex items-center gap-1.5 text-[14px] text-[#f36127] transition-colors hover:text-[#f7f8f8]">
              {linkText}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>
        <div className={flip ? "lg:col-start-1" : ""}>{panel}</div>
      </div>
    </div>
  );
}

export default function Landing() {
  const ctaReveal = useReveal();

  return (
    <main className="min-h-screen bg-[#08090a] font-sans text-[#f7f8f8] antialiased">
      <style>{`
        @keyframes darkFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .hero-in { animation: darkFadeUp .65s ease both; }
      `}</style>

      <DarkNav />

      <section className="px-6 pb-20 pt-36 text-center">
        <div className="hero-in mb-10 inline-flex items-center gap-2.5">
          <span className="h-1 w-1 shrink-0 rounded-full bg-[#f36127]" />
          <span className="text-[13px] text-[#d0d6e0]">MCP tool generation — now available</span>
          <a href={`${githubUrl}#readme`} className="inline-flex items-center gap-1 text-[13px] text-[#f36127] transition-opacity hover:opacity-80">→ Read the docs</a>
        </div>

        <h1 className="hero-in mx-auto mb-7 max-w-[860px] text-[clamp(48px,8vw,72px)] font-light leading-none tracking-[-1.58px] text-[#f7f8f8]" style={{ animationDelay: "0.05s" }}>
          Turn your API into
          <br />
          tools agents trust.
        </h1>

        <p className="hero-in mx-auto mb-10 max-w-[480px] text-[17px] leading-[1.6] text-[#8a8f98]" style={{ animationDelay: "0.1s" }}>
          Contrakt scans your Next.js routes, generates a live contract, detects schema drift, and outputs MCP tools — all from your existing code.
        </p>

        <div className="hero-in mb-20 flex flex-wrap justify-center gap-3" style={{ animationDelay: "0.15s" }}>
          <a href={githubLoginHref} className="flex items-center gap-2 rounded-md bg-[#f36127] px-4 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90">
            Get started <ArrowRight className="h-4 w-4" />
          </a>
          <a href={githubUrl} className="flex items-center gap-2 rounded-md border border-[#23252a] px-4 py-2 text-[14px] text-[#8a8f98] transition-colors hover:border-[#323334] hover:text-[#f7f8f8]">
            <GitBranch className="h-4 w-4" /> View on GitHub
          </a>
        </div>

        <div className="hero-in mx-auto max-w-[900px]" style={{ animationDelay: "0.2s" }}>
          <ContraktVisual />
        </div>
      </section>

      <div className="border-y border-[#23252a]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-10 gap-y-2 px-6 py-5">
          <span className="text-[13px] text-[#62666d]">Works with</span>
          {["Next.js App Router", "Pages Router", "Claude", "Cursor", "Codex"].map((item) => (
            <span key={item} className="text-[13px] text-[#8a8f98]">{item}</span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] space-y-[100px] px-6 py-32">
        <FeatureSection
          label="01 — Scan"
          headline={"Your code is\nthe documentation."}
          body="Point Contrakt at your Next.js project. It reads your route handlers and infers every type, param, and response — no annotations, no decorators, no separate schema file."
          linkText="Read the docs"
          linkHref={`${githubUrl}#readme`}
          panel={<ScanPanel />}
        />
        <FeatureSection
          label="02 — MCP"
          headline={"One command.\nEvery agent."}
          body="Run contrakt mcp and get a machine-readable tool manifest. Agents using Claude, Cursor, or Codex can call your endpoints directly — without you writing a single wrapper."
          linkText="View MCP docs"
          linkHref={`${githubUrl}#readme`}
          panel={<McpPanel />}
          flip
        />
        <FeatureSection
          label="03 — Drift"
          headline={"Break it in code.\nNot in production."}
          body="Run contrakt check in CI. Every deploy is compared against the last contract. New required fields, renamed params, changed shapes — caught before agents encounter them."
          linkText="CI integration guide"
          linkHref={`${githubUrl}#readme`}
          panel={<DriftPanel />}
        />
        <FeatureSection
          label="04 — Registry"
          headline={"Publish once.\nDiscovered forever."}
          body="Push your contract to the registry. Agents and developers find your API, inspect its schema, and subscribe to change notifications — without asking you."
          linkText="Browse registry"
          linkHref="/registry"
          panel={<RegistryPanel />}
          flip
        />
      </div>

      <div
        ref={ctaReveal.ref}
        className="border-t border-[#23252a] transition-all duration-700"
        style={{ opacity: ctaReveal.visible ? 1 : 0, transform: ctaReveal.visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <div className="mx-auto max-w-[1200px] px-6 py-32 text-center">
          <h2 className="mx-auto mb-10 max-w-[700px] text-[clamp(44px,7vw,64px)] font-light leading-[1.13] tracking-[-0.96px] text-[#f7f8f8]">
            Agent-ready.
            <br />
            Available today.
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={githubLoginHref} className="flex items-center gap-2 rounded-md bg-[#f36127] px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90">
              Get started free <ArrowRight className="h-4 w-4" />
            </a>
            <a href={githubUrl} className="flex items-center gap-2 rounded-md border border-[#23252a] px-5 py-2.5 text-[14px] text-[#8a8f98] transition-colors hover:border-[#323334] hover:text-[#f7f8f8]">
              <GitBranch className="h-4 w-4" /> Star on GitHub
            </a>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#23252a]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 px-6 py-16 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <Image src="/images/contrakt-logo-white.png" alt="Contrakt" width={28} height={28} />
              <span className="text-[22px] font-bold leading-none tracking-[-0.45px] text-[#f7f8f8]">Contrakt</span>
            </div>
            <p className="text-[13px] leading-relaxed text-[#62666d]">Open-source API contract layer for the age of agents.</p>
          </div>
          {[
            { heading: "Product", links: [["Docs", `${githubUrl}#readme`], ["Changelog", githubUrl], ["Registry", "/registry"], ["Pricing", githubUrl]] },
            { heading: "Features", links: [["Contract Scan", `${githubUrl}#readme`], ["MCP Generator", `${githubUrl}#readme`], ["Drift Detection", `${githubUrl}#readme`], ["Registry", "/registry"]] },
            { heading: "Company", links: [["About", githubUrl], ["Blog", githubUrl], ["Careers", githubUrl], ["Brand", githubUrl]] },
            { heading: "Connect", links: [["GitHub", githubUrl], ["X / Twitter", githubUrl], ["Discord", githubUrl], ["Contact", githubUrl]] },
          ].map((column) => (
            <div key={column.heading}>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[#62666d]">{column.heading}</p>
              <div className="space-y-2.5">
                {column.links.map(([label, href]) => (
                  <Link key={label} href={href} className="block text-[13px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#23252a]">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row">
            <p className="text-[12px] text-[#62666d]">© 2025 Contrakt. MIT License.</p>
            <div className="flex gap-5">
              {["Privacy", "Terms", "Security"].map((label) => (
                <a key={label} href={githubUrl} className="text-[12px] text-[#62666d] transition-colors hover:text-[#8a8f98]">{label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
