"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface ContractSearchProps {
  initialQ?: string;
  initialStack?: string;
  initialSort?: string;
}

const SORTS: { id: string; label: string }[] = [
  { id: "recent", label: "Recently published" },
  { id: "earned", label: "Most earned" },
  { id: "called", label: "Most called" },
];

export default function ContractSearch({
  initialQ = "",
  initialStack = "",
  initialSort = "recent",
}: ContractSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [stack, setStack] = useState(initialStack);
  const [sort, setSort] = useState(initialSort);

  const updateSearch = useCallback(
    (newQ: string, newStack: string, newSort: string) => {
      const params = new URLSearchParams();
      if (newQ) params.set("q", newQ);
      if (newStack) params.set("stack", newStack);
      if (newSort && newSort !== "recent") params.set("sort", newSort);
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
    <div className="space-y-6">
      <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_580px]">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4"
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
              updateSearch(e.target.value, stack, sort);
            }}
            placeholder={`Search contracts, apps, tools, owners...`}
            className="w-full rounded-[8px] border border-border bg-surface py-4 pl-12 pr-4 text-[16px] text-ink placeholder-muted transition-all focus:border-accent focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-faint">Category</span>
            <div className="flex rounded-[8px] border border-border bg-surface p-1">
              <button className="rounded-[4px] bg-accent px-4 py-2 text-xs font-semibold text-[#0b1326]">All</button>
              <button className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink">Data</button>
              <button className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink">Logic</button>
              <button className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink">Utility</button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-faint">Pricing</span>
            <div className="flex rounded-[8px] border border-border bg-surface p-1">
              <button className="rounded-[4px] bg-accent px-4 py-2 text-xs font-semibold text-[#0b1326]">Any</button>
              <button className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink">Free</button>
              <button className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink">Paid</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-[0.18em] text-faint">Stack</span>
        <button
          onClick={() => {
            setStack("");
            updateSearch(q, "", sort);
          }}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              stack === ""
              ? "bg-accent text-[#0b1326]"
              : "border border-border bg-transparent text-muted hover:text-ink"
            }`}
        >
          All
        </button>
        {stacks.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStack(s === stack ? "" : s);
              updateSearch(q, s === stack ? "" : s, sort);
            }}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              stack === s
                ? "bg-accent text-[#0b1326]"
                : "border border-border bg-transparent text-muted hover:text-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="max-w-[240px]">
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            updateSearch(q, stack, e.target.value);
          }}
          className="w-full cursor-pointer rounded-[8px] border border-border bg-surface px-3 py-4 text-sm text-ink transition-all focus:border-accent focus:outline-none focus:ring-0"
          aria-label="Sort contracts"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
