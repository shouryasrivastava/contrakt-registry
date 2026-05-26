"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface ContractSearchProps {
  initialQ?: string;
  initialStack?: string;
}

export default function ContractSearch({
  initialQ = "",
  initialStack = "",
}: ContractSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [stack, setStack] = useState(initialStack);

  const updateSearch = useCallback(
    (newQ: string, newStack: string) => {
      const params = new URLSearchParams();
      if (newQ) params.set("q", newQ);
      if (newStack) params.set("stack", newStack);
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [router, pathname]
  );

  const stacks = [
    "nextjs-app-router",
    "nextjs-pages",
    "express",
    "fastapi",
    "rails",
    "django",
    "laravel",
    "gin",
    "fiber",
    "nestjs",
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            updateSearch(e.target.value, stack);
          }}
          placeholder="Search contracts by name or username..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#1f1f1f] rounded-lg text-white placeholder-[#6b7280] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs text-[#6b7280]">Filter by stack:</span>
        <button
          onClick={() => {
            setStack("");
            updateSearch(q, "");
          }}
          className={`px-2.5 py-1 rounded text-xs transition-colors ${
            stack === ""
              ? "bg-blue-500 text-white"
              : "bg-[#111111] text-[#6b7280] border border-[#1f1f1f] hover:text-white hover:border-[#2d2d2d]"
          }`}
        >
          All
        </button>
        {stacks.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStack(s === stack ? "" : s);
              updateSearch(q, s === stack ? "" : s);
            }}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              stack === s
                ? "bg-blue-500 text-white"
                : "bg-[#111111] text-[#6b7280] border border-[#1f1f1f] hover:text-white hover:border-[#2d2d2d]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
