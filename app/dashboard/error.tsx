"use client";

import RouteError from "../components/RouteError";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError title="Your API portfolio is unavailable" message="Contrakt could not load your owner data. This is usually a temporary database or network problem." reset={reset} backHref="/registry" backLabel="Public registry" />;
}
