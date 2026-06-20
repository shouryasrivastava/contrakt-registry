"use client";

import RouteError from "./components/RouteError";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      title="Contrakt could not load this page"
      message="An unexpected server response interrupted the request. Retry now, or return to the public registry."
      reset={reset}
    />
  );
}
