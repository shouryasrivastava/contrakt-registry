import Link from "next/link";

export interface StatItem {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  accent?: boolean; // render value in lime
}

/**
 * The three-up stat readout shared by the contract page and earnings page:
 * mono numbers, uppercase micro-labels, divider rails between cells.
 */
export default function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div
      className="grid rounded-2xl border border-border bg-panel overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it, i) => {
        const inner = (
          <>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted mb-2">
              {it.label}
            </p>
            <p
              className={`text-3xl font-semibold tabular-nums leading-none font-mono ${it.accent ? "text-limefg" : "text-ink"}`}
            >
              {it.value}
            </p>
            {it.sub && <p className="text-xs text-faint mt-1.5">{it.sub}</p>}
          </>
        );
        const cls = `p-5 sm:p-6 ${i > 0 ? "border-l border-border" : ""}`;
        return it.href ? (
          <Link key={it.label} href={it.href} className={`${cls} hover:bg-hover transition-colors group`}>
            {inner}
            <span className="text-[11px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">
              View →
            </span>
          </Link>
        ) : (
          <div key={it.label} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
