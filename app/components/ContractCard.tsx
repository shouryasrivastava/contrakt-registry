import Link from "next/link";
import MonetizationBadge, { type Monetization } from "./MonetizationBadge";

export interface ContractCardData {
  slug: string;
  name: string;
  username: string;
  stack: string | null;
  endpointCount: number;
  description?: string | null;
  monetization: Monetization | null;
  callsServed: number;
  updatedLabel: string;
}

export default function ContractCard({
  data,
  variant = "grid",
}: {
  data: ContractCardData;
  variant?: "grid" | "featured";
}) {
  const featured = variant === "featured";
  return (
    <Link
      href={`/u/${data.slug}`}
      className={`group block rounded-xl border bg-surface transition-all duration-150 hover:bg-hover ${
        featured ? "p-5 border-border2" : "p-4 border-border hover:border-border2"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-xs text-muted mb-0.5">{data.username}</p>
          <p className="text-ink font-medium text-sm truncate group-hover:text-accent transition-colors">
            {data.name}
          </p>
        </div>
        <MonetizationBadge monetization={data.monetization} size="sm" />
      </div>

      {featured && data.description && (
        <p className="text-xs text-muted leading-relaxed mb-3 line-clamp-2">
          {data.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-3">
        {data.stack && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-accent/10 text-accent border border-accent/20">
            {data.stack}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-faint font-mono">
        <span>{data.endpointCount} endpoint{data.endpointCount !== 1 ? "s" : ""}</span>
        <span className="text-border2">·</span>
        <span>{data.callsServed} call{data.callsServed !== 1 ? "s" : ""} served</span>
        <span className="ml-auto">{data.updatedLabel}</span>
      </div>
    </Link>
  );
}
