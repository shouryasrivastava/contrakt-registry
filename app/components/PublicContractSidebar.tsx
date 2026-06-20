import PublicRegistrySidebar from "./PublicRegistrySidebar";

export default function PublicContractSidebar({
  user,
  app,
  canManage = true,
}: {
  user: string;
  app: string;
  active?: "dashboard" | "earnings" | "mcp";
  canManage?: boolean;
}) {
  const ownerPath = `/u/${user}/${app}/dashboard`;
  const dashboardHref = canManage ? ownerPath : `/sign-in?next=${encodeURIComponent(ownerPath)}`;
  return <PublicRegistrySidebar dashboardHref={dashboardHref} />;
}
