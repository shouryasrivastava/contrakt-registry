"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
const CDPProviders = dynamic(() => import("./CDPProviders"), { ssr: false });

export default function AppProviders({ children }: { children: ReactNode }) {
  if (!projectId) return children;

  return <CDPProviders>{children}</CDPProviders>;
}
