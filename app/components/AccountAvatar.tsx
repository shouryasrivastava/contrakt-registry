"use client";

import { useState } from "react";

function initialsFor(name?: string | null): string {
  const words = (name ?? "Account").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "A";
}

export default function AccountAvatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimensions = size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-[11px]";

  if (src && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "Account"}
        onError={() => setImageFailed(true)}
        className={`${dimensions} rounded-full border border-border bg-white object-cover`}
      />
    );
  }

  return (
    <div
      aria-label={name ?? "Account"}
      title={name ?? "Account"}
      className={`${dimensions} grid place-items-center rounded-full border border-[#d8d8d8] bg-[#f4f4f4] font-mono font-semibold text-[#555]`}
    >
      {initialsFor(name)}
    </div>
  );
}
