"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-[#efefef] px-6 text-[#202020]">
          <section className="w-full max-w-lg rounded-[12px] border border-[#dedede] bg-white p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff682c]">
              Service interrupted
            </p>
            <h1 className="mt-3 text-3xl">Contrakt could not load this page</h1>
            <p className="mt-3 text-sm leading-6 text-[#666]">
              The error was recorded. Retry the request, or return to the registry if it continues.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-full bg-[#202020] px-5 py-2 text-sm font-medium text-white"
              >
                Try again
              </button>
              <Link
                href="/registry"
                className="rounded-full border border-[#202020] px-5 py-2 text-sm font-medium"
              >
                Registry
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
