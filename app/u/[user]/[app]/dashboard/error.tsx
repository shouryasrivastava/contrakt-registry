"use client";

import RouteError from "@/app/components/RouteError";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      title="API workspace data is unavailable"
      message="Contrakt could not load this API workspace. Retry the database request, or return to your API portfolio."
      reset={reset}
      backHref="/dashboard"
      backLabel="My APIs"
    />
  );
}
