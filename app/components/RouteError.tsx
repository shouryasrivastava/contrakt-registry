"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function RouteError({
  title,
  message,
  reset,
  backHref = "/registry",
  backLabel = "Public registry",
  setupHref,
  setupLabel,
}: {
  title: string;
  message: string;
  reset: () => void;
  backHref?: string;
  backLabel?: string;
  setupHref?: string;
  setupLabel?: string;
}) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[960px] flex-col">
        <header className="nav-capsule flex items-center justify-between px-4 py-2.5">
          <Link href="/" className="flex items-center gap-3 text-[17px] font-semibold tracking-tight text-ink">
            <BrandLogo priority className="w-[104px]" />
          </Link>
          <Link href={backHref} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted hover:text-ink">
            {backLabel}
          </Link>
        </header>
        <section className="grid flex-1 place-items-center py-14">
          <div className="soft-panel w-full max-w-[560px] p-7 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Unable to load this page</p>
            <h1 className="mt-3 text-[38px] leading-[0.98] text-ink">{title}</h1>
            <p className="mx-auto mt-4 max-w-md text-[14px] leading-6 text-muted">{message}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[12px] font-medium text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Try again
              </button>
              {setupHref ? (
                <Link href={setupHref} className="rounded-full border border-ink px-5 py-2.5 text-[12px] font-medium text-ink">
                  {setupLabel ?? "Fix setup"}
                </Link>
              ) : null}
              <Link href={backHref} className="rounded-full border border-border bg-white px-5 py-2.5 text-[12px] font-medium text-ink">
                {backLabel}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
