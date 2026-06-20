import Link from "next/link";
import type { Metadata } from "next";
import CopyButton from "./components/CopyButton";
import LiveStats from "./components/LiveStats";
import BrandLogo from "./components/BrandLogo";
import { REGISTRY_URL, SITE_URL, registryUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contrakt",
  alternates: {
    canonical: SITE_URL,
  },
};

const TERMINAL_LINES = [
  "cd my-nextjs-app",
  "contrakt init  # Infer contract + generate MCP config",
  "contrakt check  # Check for drift",
  "contrakt doctor  # Missing setup steps",
  "contrakt check --update  # Accept new baseline",
  "contrakt publish --name my-app",
  "contrakt monetize --receiver 0xYourWallet --price 0.001 --free-calls 5",
  "contrakt monetize --publish",
  "contrakt watch https://registry.contrakt.dev/u/username/my-app --depend",
];

const FEATURES = [
  {
    title: "Machine-Readable Discovery",
    body: "Native MCP integration allows AI agents to ingest your API capabilities without human glue code.",
  },
  {
    title: "x402 Protocol Payments",
    body: "Implement zero-friction per-call settlements for high-velocity agent workflows and monetized tool access.",
  },
  {
    title: "Zero-Latency MCP Integration",
    body: "Connect your data directly to Claude, GPT-4, and open-source agents through a standardized context layer.",
  },
];

export default async function HomePage() {
  const myApisHref = registryUrl("/dashboard");
  const publishHref = myApisHref;

  return (
    <div className="min-h-screen bg-[#efefef] text-[#1a1c1c]">
      <nav className="fixed left-1/2 top-6 z-50 flex w-[90%] max-w-[1160px] -translate-x-1/2 items-center justify-between gap-8 rounded-full border border-[#e8e8e8] bg-white/88 px-6 py-3 shadow-[0_4px_12px_rgba(32,32,32,0.03)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Contrakt home">
            <BrandLogo priority className="w-[116px]" />
          </Link>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <Link className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5f5e5e] transition-colors hover:text-[#202020]" href={`${REGISTRY_URL}/registry`}>
            Registry
          </Link>
          <Link className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5f5e5e] transition-colors hover:text-[#202020]" href="https://github.com/shouryasrivastava/contrakt#readme" target="_blank" rel="noopener noreferrer">
            Documentation
          </Link>
          <Link className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5f5e5e] transition-colors hover:text-[#202020]" href={myApisHref}>
            My APIs
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href={publishHref} className="hidden rounded-full border border-[#202020] bg-transparent px-5 py-2 text-[13px] font-medium text-[#202020] sm:inline-flex">
            Publish API
          </Link>
          <Link href={`${REGISTRY_URL}/registry`} className="inline-flex rounded-full bg-[#202020] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#4d4d4d]">
            Open Registry
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-5 pb-20 pt-36">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-20 lg:grid-cols-2">
          <div className="space-y-8">
            <h1 className="max-w-xl font-[family-name:var(--font-display)] text-[66px] font-normal leading-[0.91] tracking-[-0.02em] text-[#202020]">
              The Marketplace for the Agent Economy.
            </h1>
            <p className="max-w-md text-[18px] leading-[1.33] text-[#5f5e5e]">
              Contrakt is the protocol layer for machine-readable discovery, enforceable smart contracts, and real-time settlements in the machine economy.
            </p>
            <LiveStats />
            <div className="flex flex-wrap gap-4">
              <Link href={publishHref} className="rounded-full bg-[#202020] px-10 py-3 text-[16px] font-semibold text-white transition-all hover:bg-[#4d4d4d]">
                Publish Your API
              </Link>
              <Link href={`${REGISTRY_URL}/registry`} className="rounded-full border border-[#202020] px-10 py-3 text-[16px] font-semibold text-[#202020] transition-all hover:bg-[#202020] hover:text-white">
                Explore Registry
              </Link>
              <a href="#quickstart" className="rounded-full border border-[#202020] px-10 py-3 text-[16px] font-semibold text-[#202020] transition-all hover:bg-[#202020] hover:text-white">
                Quickstart
              </a>
            </div>
          </div>

          <div className="relative hidden h-[500px] lg:block">
            <div className="absolute inset-x-8 top-8 rounded-[14px] border border-[#dedede] bg-white p-8 shadow-[0_18px_50px_rgba(32,32,32,0.08)]">
              <div className="flex items-center justify-between border-b border-[#e8e8e8] pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff682c]">
                    Published contract
                  </p>
                  <h3 className="mt-2 text-[25px] font-semibold">acme/weather-api</h3>
                </div>
                <span className="rounded-full border border-[#dedede] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
                  8 endpoints
                </span>
              </div>
              <div className="space-y-5 py-6">
                {[
                  ["01", "Infer", "Route handlers become a versioned contract."],
                  ["02", "Expose", "MCP clients discover typed tools from the registry."],
                  ["03", "Settle", "Base Sepolia verifies USDC receipts during beta."],
                ].map(([step, title, body]) => (
                  <div key={step} className="grid grid-cols-[34px_90px_1fr] items-start gap-3">
                    <span className="font-mono text-[11px] text-[#ff682c]">{step}</span>
                    <strong className="text-[14px]">{title}</strong>
                    <span className="text-[13px] leading-5 text-[#666]">{body}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-[9px] bg-[#111827] px-4 py-3 font-mono text-[11px] text-[#e8edf7]">
                <span>contrakt publish --name weather-api</span>
                <span className="text-[#ff8050]">ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="quickstart" className="bg-[#efefef] py-[80px]">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="mb-9 text-center">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-[40px] leading-[1.13] tracking-[-0.02em] text-[#202020]">
              Quickstart
            </h2>
            <p className="text-[18px] text-[#5f5e5e]">Get your agent economy ready in seconds.</p>
          </div>

          <div className="mx-auto max-w-2xl space-y-5">
            <div className="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl bg-[#202020] p-5 shadow-xl transition-all duration-300 hover:ring-2 hover:ring-[#ff682c]/20">
              <code className="text-[18px] text-white">npm install -g contrakt</code>
              <CopyButton text="npm install -g contrakt" className="text-white hover:text-[#ff682c]" label="Copy" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-md">
              <div className="flex items-center justify-between border-b border-[#e8e8e8] bg-[#f5f5f5] px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#e8e8e8]" />
                  <div className="h-3 w-3 rounded-full bg-[#e8e8e8]" />
                  <div className="h-3 w-3 rounded-full bg-[#e8e8e8]" />
                  <span className="ml-2 font-mono text-[12px] text-[#5f5e5e]">terminal — contrakt-workflow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-mono text-[10px] uppercase tracking-tight text-[#5f5e5e]">live</span>
                </div>
              </div>

              <div className="relative min-h-[340px] space-y-4 overflow-x-auto p-9 font-mono text-[14px]">
                <div className="pointer-events-none absolute left-0 right-0 top-[22%] h-8 border-l-2 border-[#ff682c] bg-[#ff682c]/10" />
                {TERMINAL_LINES.map((line, index) => (
                  <div key={line} className="relative z-10 flex gap-4">
                    <span className="select-none text-[#5f5e5e]/40">{index + 1}</span>
                    <code className="text-[#202020]">{line}</code>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-[#e8e8e8] bg-white/50 p-4">
              <span className="text-[#ff682c]">i</span>
              <p className="text-[14px] text-[#5f5e5e]">
                Commit <code className="font-bold text-[#202020]">contrakt.lock</code> to your repo. Run{" "}
                <code className="font-bold text-[#202020]">contrakt check</code> in CI.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-[80px]">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="mx-auto mb-[140px] max-w-2xl text-center">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-[40px] leading-[1.13] tracking-[-0.02em] text-[#202020]">
              Built for the Autonomous Economy.
            </h2>
            <p className="text-[18px] text-[#5f5e5e]">
              The infrastructure required to turn agents from tools into economic participants.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-9 md:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <div key={feature.title} className="group rounded-xl border border-[#e8e8e8] bg-white p-10 transition-all duration-300 hover:-translate-y-2 hover:border-[#ff682c]">
                <div className="mb-9 flex h-12 w-12 items-center justify-center rounded-lg bg-[#efefef] transition-colors group-hover:bg-[#ffdbcf]">
                  <span className="text-[#202020]">{index === 0 ? "◌" : index === 1 ? "$" : "⟷"}</span>
                </div>
                <h3 className="mb-4 font-[family-name:var(--font-display)] text-[32px] leading-[1.19] tracking-[-0.02em] text-[#202020]">
                  {feature.title}
                </h3>
                <p className="text-[16px] leading-[1.38] text-[#5f5e5e]">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
