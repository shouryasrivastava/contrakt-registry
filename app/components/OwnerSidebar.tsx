import {
  Boxes,
  Cable,
  CircleDollarSign,
  GitFork,
  History,
  LayoutGrid,
  Settings,
  UsersRound,
} from "lucide-react";
import { SidebarNav } from "./WorkspaceChrome";

export type OwnerSection =
  | "portfolio"
  | "settings"
  | "overview"
  | "consumers"
  | "monetization"
  | "integrations";

export default function OwnerSidebar({
  active,
  slug,
  appName,
  endpointCount,
}: {
  active: OwnerSection;
  slug?: string;
  appName?: string;
  endpointCount?: number;
}) {
  const apiBase = slug ? `/u/${slug}/dashboard` : null;

  return (
    <div className="flex h-full min-h-[620px] flex-col px-4 py-5">
      {slug ? (
        <div className="mb-2 border-b border-border px-2 pb-5">
          <p className="truncate text-[15px] font-semibold text-ink">{appName}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {endpointCount ?? 0} endpoint{endpointCount === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}

      <SidebarNav
        items={
          apiBase
            ? [
                { label: "Overview", icon: LayoutGrid, href: apiBase, active: active === "overview" },
                { label: "Consumers", icon: UsersRound, href: `${apiBase}/consumers`, active: active === "consumers" },
                {
                  label: "Monetization · Beta",
                  icon: CircleDollarSign,
                  href: `${apiBase}/monetization`,
                  active: active === "monetization",
                },
                { label: "Integrations", icon: Cable, href: `${apiBase}/integrations`, active: active === "integrations" },
              ]
            : [
                { label: "My APIs", icon: Boxes, href: "/dashboard", active: active === "portfolio" },
                { label: "Settings", icon: Settings, href: "/dashboard/settings", active: active === "settings" },
                { label: "Public Registry", icon: GitFork, href: "/registry" },
              ]
        }
      />

      {apiBase ? (
        <div className="mt-auto border-t border-border pt-5">
          <SidebarNav
            items={[
              { label: "All APIs", icon: Boxes, href: "/dashboard" },
              { label: "Account settings", icon: Settings, href: "/dashboard/settings" },
              { label: "Public Registry", icon: History, href: "/registry" },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
