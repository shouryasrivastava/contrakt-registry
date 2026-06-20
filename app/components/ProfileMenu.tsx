"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AccountAvatar from "./AccountAvatar";
import DisconnectGitHubButton from "./DisconnectGitHubButton";

export default function ProfileMenu({
  image,
  name,
  username,
  email,
}: {
  image?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const identity = username ? `@${username}` : name ?? email ?? "GitHub account";

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Open account menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="rounded-full outline-none ring-accent focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <AccountAvatar src={image} name={name ?? username} size="sm" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[200] w-[220px] rounded-[12px] border border-border bg-white p-2 shadow-[0_18px_50px_rgba(32,32,32,0.14)]">
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-[12px] font-semibold text-ink">{identity}</p>
            {email ? <p className="mt-1 truncate text-[10px] text-faint">{email}</p> : null}
          </div>
          <Link
            href="/dashboard/settings"
            prefetch
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-[9px] px-3 py-2 text-[12px] text-ink hover:bg-[#f5f5f5]"
          >
            Account settings
          </Link>
          <DisconnectGitHubButton compact onBegin={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
