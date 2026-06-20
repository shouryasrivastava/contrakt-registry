import { BookOpen, Boxes, LayoutGrid } from "lucide-react";
import { SidebarNav } from "./WorkspaceChrome";

export default function PublicRegistrySidebar({
  dashboardHref,
}: {
  dashboardHref: string;
}) {
  return (
    <div className="flex h-full min-h-[520px] flex-col px-4 py-5">
      <SidebarNav
        items={[
          { label: "Registry", icon: LayoutGrid, href: "/registry", active: true },
          {
            label: "Documentation",
            icon: BookOpen,
            href: "https://github.com/shouryasrivastava/contrakt#readme",
          },
          { label: "My APIs", icon: Boxes, href: dashboardHref },
        ]}
      />
    </div>
  );
}
