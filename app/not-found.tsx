import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-ink">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[960px] place-items-center">
        <section className="soft-panel max-w-[560px] p-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">404</p>
          <h1 className="mt-3 text-[42px] leading-none text-ink">This contract page does not exist</h1>
          <p className="mt-4 text-[14px] leading-6 text-muted">The contract may have moved, been unpublished, or the address may be incomplete.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link href="/registry" className="rounded-full bg-ink px-5 py-2.5 text-[12px] font-medium text-white">Browse registry</Link>
            <Link href="/dashboard" className="rounded-full border border-border bg-white px-5 py-2.5 text-[12px] font-medium text-ink">My APIs</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
