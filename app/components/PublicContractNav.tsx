import Link from "next/link";
import ConnectWalletButton from "./ConnectWalletButton";
import { FloatingNav } from "./WorkspaceChrome";

export default function PublicContractNav({ dashboardHref }: { dashboardHref: string }) {
  return (
    <FloatingNav
      apisHref={dashboardHref}
      actions={
        <>
          <Link href="/registry" className="hidden rounded-full border border-ink px-4 py-2 text-[12px] font-medium text-ink sm:block">
            Browse registry
          </Link>
          <ConnectWalletButton />
        </>
      }
    />
  );
}
