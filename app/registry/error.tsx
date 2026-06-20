"use client";

import RouteError from "../components/RouteError";

export default function RegistryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Live registry data is unavailable" message="Contrakt could not reach the registry database. Retry without losing your current account or contract data." reset={reset} />;
}
