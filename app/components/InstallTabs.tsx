"use client";

import { useState } from "react";
import CopyButton from "./CopyButton";

export interface Snippet {
  id: string;
  label: string;
  code: string;
  note?: string;
}

export default function InstallTabs({ snippets }: { snippets: Snippet[] }) {
  const [active, setActive] = useState(snippets[0]?.id);
  const current = snippets.find((s) => s.id === active) ?? snippets[0];

  return (
    <div className="rounded-[24px] border border-border bg-panel overflow-hidden">
      <div className="flex items-center gap-1 px-2 pt-2 border-b border-border">
        {snippets.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={`px-3 py-2 text-sm rounded-t-lg transition-colors ${
              active === s.id
                ? "text-ink bg-inset border-x border-t border-border -mb-px"
                : "text-muted hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {current?.note && (
          <p className="text-xs text-muted mb-3 leading-relaxed">{current.note}</p>
        )}
        <div className="rounded-2xl border border-border bg-inset overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-background/40">
            <span className="text-[11px] font-mono uppercase tracking-wider text-faint">
              {current?.label}
            </span>
            <CopyButton text={current?.code ?? ""} />
          </div>
          <pre className="px-4 py-3 overflow-x-auto text-[12.5px] leading-[1.65] font-mono text-ink2 whitespace-pre">
            {current?.code}
          </pre>
        </div>
      </div>
    </div>
  );
}
