import Link from "next/link";
import BrandLogo from "./BrandLogo";

export default function DataUnavailable({
  title = "Registry data is unavailable",
  message = "Contrakt could not reach the database. This is usually a temporary Neon/network issue.",
  retryHref,
}: {
  title?: string;
  message?: string;
  retryHref: string;
}) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[920px] flex-col">
        <header className="nav-capsule flex items-center justify-between px-4 py-2.5">
          <Link href="/" className="flex items-center gap-3 text-[17px] font-semibold tracking-tight text-ink">
            <BrandLogo priority className="w-[104px]" />
          </Link>
          <Link href="/registry" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-ink">
            Public Registry
          </Link>
        </header>

        <section className="grid flex-1 place-items-center py-14">
          <div className="soft-panel max-w-xl p-7 text-center">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">Temporary outage</p>
            <h1 className="font-[family-name:var(--font-display)] text-[44px] leading-[0.95] tracking-[-0.03em] text-[#202020]">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-[1.6] text-muted">{message}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={retryHref}
                className="rounded-full bg-[#202020] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#3a3a3a]"
              >
                Try again
              </Link>
              <Link
                href="/registry"
                className="rounded-full border border-border bg-white px-5 py-2.5 text-[13px] font-semibold text-[#202020] transition hover:bg-[#f7f7f7]"
              >
                Back to registry
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
