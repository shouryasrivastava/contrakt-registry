"use client";

import RouteError from "@/app/components/RouteError";

export default function PublicContractError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="This contract is temporarily unavailable" message="Contrakt could not load the live contract record. Retry, or browse another API in the registry." reset={reset} />;
}
