import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import DepositUSDCButton from "./DepositUSDCButton";
import BrandLogo from "./BrandLogo";

export function FloatingNav({
  active,
  actions,
  apisHref = "/dashboard",
}: {
  active?: "docs" | "apis";
  actions?: ReactNode;
  apisHref?: string;
}) {
  const items = [
    { id: "docs", label: "Documentation", href: "https://github.com/shouryasrivastava/contrakt#readme", external: true },
    { id: "apis", label: "My APIs", href: apisHref },
  ] as const;

  return (
    <header className="nav-capsule mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Contrakt home" className="inline-flex items-center">
          <BrandLogo priority className="w-[104px]" />
        </Link>
      </div>
      <nav className="hidden items-center gap-5 md:flex">
        {items.map((item) => {
          const isActive = active === item.id;
          const className = `border-b-2 pb-1 text-[11px] uppercase tracking-[0.18em] transition-colors ${
            isActive
              ? "border-accent font-semibold text-ink"
              : "border-transparent text-muted hover:text-ink"
          }`;

          if ("external" in item && item.external) {
            return (
              <Link key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
                {item.label}
              </Link>
            );
          }

          return (
            <Link key={item.id} href={item.href} className={className}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
}

export function WorkspaceLayout({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-[1320px] grid-cols-1 overflow-hidden rounded-[20px] border border-border bg-white lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-[#f5f5f5] lg:border-b-0 lg:border-r">{sidebar}</aside>
      <section className="min-w-0 bg-[#efefef]">{children}</section>
    </div>
  );
}

export function SidebarNav({
  items,
}: {
  items: Array<{ label: string; href: string; icon: LucideIcon; active?: boolean }>;
}) {
  return (
    <nav className="mt-7 space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        const className = `flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[14px] transition-colors active:scale-[0.99] ${
          item.active
            ? "bg-white font-semibold text-ink shadow-[0_1px_3px_rgba(32,32,32,0.04),0_4px_12px_rgba(32,32,32,0.03)]"
            : "text-muted hover:bg-white/70 hover:text-ink"
        }`;

        if (item.href.startsWith("#") || item.href.startsWith("http")) {
          return (
            <a
              key={item.label}
              href={item.href}
              className={className}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              <Icon className={`h-4.5 w-4.5 ${item.active ? "text-accent" : "text-muted"}`} />
              {item.label}
            </a>
          );
        }

        return (
          <Link key={item.label} href={item.href} prefetch className={className}>
            <Icon className={`h-4.5 w-4.5 ${item.active ? "text-accent" : "text-muted"}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarUtility() {
  return (
    <div className="mt-7">
      <DepositUSDCButton />
    </div>
  );
}

export function Panel({
  title,
  eyebrow,
  right,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`soft-panel ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5">
        <div>
          {eyebrow ? (
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-faint">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-[21px] leading-[1] tracking-[-0.03em] text-ink">{title}</h2>
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
