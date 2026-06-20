"use client";

import type { ReactNode } from "react";
import { CDPReactProvider, type Config } from "@coinbase/cdp-react";

const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;

const config: Config = {
  projectId: projectId ?? "",
  appName: "Contrakt",
  authMethods: ["email"],
  ethereum: { createOnLogin: "smart" },
  disableAnalytics: true,
};

export default function CDPProviders({ children }: { children: ReactNode }) {
  return <CDPReactProvider config={config}>{children}</CDPReactProvider>;
}
