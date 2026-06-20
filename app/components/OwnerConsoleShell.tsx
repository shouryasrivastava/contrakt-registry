import type { ReactNode } from "react";
import ConnectWalletButton from "./ConnectWalletButton";
import ProfileMenu from "./ProfileMenu";
import { FloatingNav, WorkspaceLayout } from "./WorkspaceChrome";
import OwnerSidebar, { type OwnerSection } from "./OwnerSidebar";

export default function OwnerConsoleShell({
  active,
  session,
  slug,
  appName,
  endpointCount,
  action,
  children,
}: {
  active: OwnerSection;
  session: {
    user: {
      image?: string | null;
      name?: string | null;
      username?: string | null;
      email?: string | null;
    };
  };
  slug?: string;
  appName?: string;
  endpointCount?: number;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background px-3 pb-10 pt-5 sm:px-5">
      <FloatingNav
        active="apis"
        actions={
          <>
            {action ? <div className="hidden sm:block">{action}</div> : null}
            <ConnectWalletButton />
            <ProfileMenu
              image={session.user.image}
              name={session.user.name}
              username={session.user.username}
              email={session.user.email}
            />
          </>
        }
      />
      <main className="pt-5">
        <WorkspaceLayout
          sidebar={
            <OwnerSidebar
              active={active}
              slug={slug}
              appName={appName}
              endpointCount={endpointCount}
            />
          }
        >
          {children}
        </WorkspaceLayout>
      </main>
    </div>
  );
}
